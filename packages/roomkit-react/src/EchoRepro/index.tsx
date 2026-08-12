import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Echo reproduction and AEC probe.
 *
 * Throwaway diagnostic surface. Purpose: calibrate the ERLE discriminator against a known
 * echo path, because field telemetry cannot currently tell "the far end's voice coming back"
 * from "someone at the far end replying".
 *
 * It does that locally, on one device, with no room and no token:
 *  - plays tone bursts out of a chosen output device, so there is a real render stream for
 *    AEC3 to reference and a real acoustic path into the mic;
 *  - captures the mic with explicit getUserMedia constraints, so echoCancellation can
 *    actually be turned off (the SDK's HMSAudioTrackSettings only carries deviceId plus a
 *    best-effort `advanced` array, which browsers may silently skip);
 *  - attaches the mic to a loopback RTCPeerConnection purely so `getStats` produces the
 *    audio `media-source` entry that carries echoReturnLoss / echoReturnLossEnhancement.
 *
 * The burst/gap structure is the point. Gaps are guaranteed silence at the source, so mic
 * energy measured during a burst versus during a gap is an echo measurement with no
 * double-talk ambiguity — the thing that makes the production 1 Hz data inconclusive.
 *
 * AEC3's idle ERLE is 0.17551203072071075. Pinned there with a single distinct value means a
 * canceller is running and has found no echo path; a moving value means it is working against
 * a real one; the field being absent entirely means no canceller is applied to the capture.
 */

const AEC3_IDLE_ERLE = 0.17551203072071075;
const POLL_MS = 250;

interface AudioSourceSample {
  t: number;
  audioLevel?: number;
  totalAudioEnergy?: number;
  totalSamplesDuration?: number;
  echoReturnLoss?: number;
  echoReturnLossEnhancement?: number;
  /** true when the tone generator was emitting at sample time */
  bursting: boolean;
  /** RMS over the interval since the previous sample, from integrated energy */
  rms?: number;
}

type Verdict = 'no-canceller' | 'idle' | 'working' | 'unknown';

const verdictOf = (samples: AudioSourceSample[]): Verdict => {
  const withStat = samples.filter(s => s.echoReturnLossEnhancement !== undefined);
  if (samples.length < 4) {
    return 'unknown';
  }
  if (withStat.length === 0) {
    return 'no-canceller';
  }
  const distinct = new Set(withStat.map(s => s.echoReturnLossEnhancement));
  if (distinct.size === 1 && Math.abs((withStat[0].echoReturnLossEnhancement ?? 0) - AEC3_IDLE_ERLE) < 1e-9) {
    return 'idle';
  }
  return distinct.size > 1 ? 'working' : 'idle';
};

const dbov = (rms?: number) => (rms && rms > 1e-12 ? 20 * Math.log10(rms) : undefined);

const fmt = (v?: number, digits = 4) => (v === undefined ? '—' : v.toFixed(digits));

const median = (xs: number[]) => {
  if (!xs.length) {
    return undefined;
  }
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const pickAudioSource = (report: RTCStatsReport) => {
  let found: Record<string, number | string | undefined> | undefined;
  report.forEach(raw => {
    const stat = raw as unknown as Record<string, number | string | undefined>;
    const kind = stat.kind ?? stat.mediaType;
    if (stat.type === 'media-source' && kind === 'audio') {
      found = stat;
    }
  });
  return found;
};

export const EchoRepro = () => {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const [inputId, setInputId] = useState('');
  const [outputId, setOutputId] = useState('');

  const [aec, setAec] = useState(true);
  const [agc, setAgc] = useState(true);
  const [ns, setNs] = useState(true);

  const [freq, setFreq] = useState(440);
  const [gain, setGain] = useState(0.6);
  const [burstMs, setBurstMs] = useState(1000);
  const [gapMs, setGapMs] = useState(3000);

  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [samples, setSamples] = useState<AudioSourceSample[]>([]);
  const [bursting, setBursting] = useState(false);
  const [appliedSettings, setAppliedSettings] = useState<MediaTrackSettings | null>(null);
  const [micLabel, setMicLabel] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<[RTCPeerConnection, RTCPeerConnection] | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const burstTimerRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const burstingRef = useRef(false);
  const prevRef = useRef<{ energy?: number; duration?: number }>({});

  const refreshDevices = useCallback(async () => {
    const list = await navigator.mediaDevices.enumerateDevices();
    setInputs(list.filter(d => d.kind === 'audioinput'));
    setOutputs(list.filter(d => d.kind === 'audiooutput'));
  }, []);

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
  }, [refreshDevices]);

  const stop = useCallback(() => {
    if (burstTimerRef.current) {
      window.clearTimeout(burstTimerRef.current);
      burstTimerRef.current = null;
    }
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    oscRef.current?.stop();
    oscRef.current = null;
    gainRef.current = null;
    ctxRef.current?.close();
    ctxRef.current = null;
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    pcRef.current?.forEach(pc => pc.close());
    pcRef.current = null;
    burstingRef.current = false;
    setBursting(false);
    setRunning(false);
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    setError('');
    setSamples([]);
    prevRef.current = {};
    try {
      // 1. Mic with explicit, non-negotiable constraints so AEC can genuinely be disabled.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(inputId ? { deviceId: { exact: inputId } } : {}),
          echoCancellation: aec,
          autoGainControl: agc,
          noiseSuppression: ns,
        },
        video: false,
      });
      streamRef.current = stream;
      const track = stream.getAudioTracks()[0];
      setAppliedSettings(track.getSettings());
      setMicLabel(track.label);
      await refreshDevices();

      // 2. Loopback peer connection. Its only job is to make getStats emit the audio
      //    media-source entry that carries ERL / ERLE.
      const a = new RTCPeerConnection();
      const b = new RTCPeerConnection();
      pcRef.current = [a, b];
      a.onicecandidate = e => e.candidate && b.addIceCandidate(e.candidate);
      b.onicecandidate = e => e.candidate && a.addIceCandidate(e.candidate);
      a.addTrack(track, stream);
      const offer = await a.createOffer();
      await a.setLocalDescription(offer);
      await b.setRemoteDescription(offer);
      const answer = await b.createAnswer();
      await b.setLocalDescription(answer);
      await a.setRemoteDescription(answer);

      // 3. Tone generator routed through an <audio> element so setSinkId picks the speaker.
      //    Playing through the real output device is what creates the acoustic path.
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const dest = ctx.createMediaStreamDestination();
      osc.frequency.value = freq;
      osc.type = 'sine';
      g.gain.value = 0;
      osc.connect(g);
      g.connect(dest);
      osc.start();
      oscRef.current = osc;
      gainRef.current = g;

      const el = audioElRef.current;
      if (el) {
        el.srcObject = dest.stream;
        const withSink = el as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
        if (outputId && typeof withSink.setSinkId === 'function') {
          try {
            await withSink.setSinkId(outputId);
          } catch (e) {
            setError(`setSinkId failed (output stays on system default): ${String(e)}`);
          }
        }
        await el.play();
      }

      // 4. Burst / gap cycle. Ramped edges keep the speaker from clicking.
      const cycle = () => {
        const node = gainRef.current;
        const audioCtx = ctxRef.current;
        if (!node || !audioCtx) {
          return;
        }
        const next = !burstingRef.current;
        burstingRef.current = next;
        setBursting(next);
        node.gain.cancelScheduledValues(audioCtx.currentTime);
        node.gain.setTargetAtTime(next ? gain : 0, audioCtx.currentTime, 0.01);
        burstTimerRef.current = window.setTimeout(cycle, next ? burstMs : gapMs);
      };
      cycle();

      // 5. Poll the media-source stats.
      pollTimerRef.current = window.setInterval(async () => {
        const pcs = pcRef.current;
        if (!pcs) {
          return;
        }
        const stat = pickAudioSource(await pcs[0].getStats());
        if (!stat) {
          return;
        }
        const energy = stat.totalAudioEnergy as number | undefined;
        const duration = stat.totalSamplesDuration as number | undefined;
        let rms: number | undefined;
        const prev = prevRef.current;
        if (
          energy !== undefined &&
          duration !== undefined &&
          prev.energy !== undefined &&
          prev.duration !== undefined
        ) {
          const de = energy - prev.energy;
          const dd = duration - prev.duration;
          if (dd > 0 && de >= 0) {
            rms = Math.sqrt(de / dd);
          }
        }
        prevRef.current = { energy, duration };
        setSamples(cur =>
          cur.concat({
            t: Date.now(),
            audioLevel: stat.audioLevel as number | undefined,
            totalAudioEnergy: energy,
            totalSamplesDuration: duration,
            echoReturnLoss: stat.echoReturnLoss as number | undefined,
            echoReturnLossEnhancement: stat.echoReturnLossEnhancement as number | undefined,
            bursting: burstingRef.current,
            rms,
          }),
        );
      }, POLL_MS);

      setRunning(true);
    } catch (e) {
      setError(String(e));
      stop();
    }
  }, [inputId, outputId, aec, agc, ns, freq, gain, burstMs, gapMs, refreshDevices, stop]);

  const latest = samples[samples.length - 1];
  const verdict = verdictOf(samples);

  // The echo measurement: mic energy while the tone plays vs while it is silent. Gaps are
  // silent at the source, so a positive delta is a return path and nothing else.
  const analysis = useMemo(() => {
    // drop the sample straddling each edge — it spans both states
    const usable = samples.filter((s, i) => i > 0 && s.bursting === samples[i - 1].bursting && s.rms !== undefined);
    const on = usable.filter(s => s.bursting).map(s => s.rms as number);
    const off = usable.filter(s => !s.bursting).map(s => s.rms as number);
    const mOn = median(on);
    const mOff = median(off);
    const dOn = dbov(mOn);
    const dOff = dbov(mOff);
    return {
      nOn: on.length,
      nOff: off.length,
      dOn,
      dOff,
      delta: dOn !== undefined && dOff !== undefined ? dOn - dOff : undefined,
      erleValues: new Set(
        samples.filter(s => s.echoReturnLossEnhancement !== undefined).map(s => s.echoReturnLossEnhancement),
      ).size,
      erleMin: Math.min(...samples.map(s => s.echoReturnLossEnhancement ?? Infinity)),
      erleMax: Math.max(...samples.map(s => s.echoReturnLossEnhancement ?? -Infinity)),
      clipped: samples.some(s => (s.audioLevel ?? 0) >= 0.999),
    };
  }, [samples]);

  const copyJson = () => {
    const payload = {
      capturedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      requested: { deviceId: inputId, echoCancellation: aec, autoGainControl: agc, noiseSuppression: ns },
      applied: appliedSettings,
      micLabel,
      tone: { freq, gain, burstMs, gapMs, outputId },
      verdict,
      analysis,
      samples,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  };

  const box: React.CSSProperties = {
    border: '1px solid #444',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    background: '#1a1a1e',
  };
  const row: React.CSSProperties = { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' };
  const label: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 };

  const verdictColour = {
    working: '#3fb950',
    idle: '#d29922',
    'no-canceller': '#f85149',
    unknown: '#8b949e',
  }[verdict];

  const verdictText = {
    working: 'AEC is working against a real echo path',
    idle: 'AEC is running but found no echo path',
    'no-canceller': 'No canceller applied to the capture path',
    unknown: 'collecting…',
  }[verdict];

  return (
    <div
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: '#e6edf3',
        background: '#0d1117',
        minHeight: '100vh',
        padding: 24,
      }}
    >
      <h2 style={{ margin: '0 0 4px' }}>Echo repro / AEC probe</h2>
      <p style={{ color: '#8b949e', marginTop: 0, maxWidth: 760, lineHeight: 1.5 }}>
        Plays tone bursts out of the selected speaker and measures what comes back into the selected microphone. Gaps
        between bursts are silent at the source, so mic energy during a burst versus during a gap is an echo measurement
        with no double-talk ambiguity. Use a speaker, not headphones, to create an echo path.
      </p>

      <div style={box}>
        <div style={row}>
          <label style={label}>
            Microphone
            <select value={inputId} onChange={e => setInputId(e.target.value)} disabled={running}>
              <option value="">system default</option>
              {inputs.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || d.deviceId}
                </option>
              ))}
            </select>
          </label>
          <label style={label}>
            Speaker
            <select value={outputId} onChange={e => setOutputId(e.target.value)} disabled={running}>
              <option value="">system default</option>
              {outputs.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || d.deviceId}
                </option>
              ))}
            </select>
          </label>
          <button onClick={refreshDevices} disabled={running}>
            refresh devices
          </button>
        </div>

        <div style={{ ...row, marginTop: 16 }}>
          <label>
            <input type="checkbox" checked={aec} onChange={e => setAec(e.target.checked)} disabled={running} />{' '}
            echoCancellation
          </label>
          <label>
            <input type="checkbox" checked={agc} onChange={e => setAgc(e.target.checked)} disabled={running} />{' '}
            autoGainControl
          </label>
          <label>
            <input type="checkbox" checked={ns} onChange={e => setNs(e.target.checked)} disabled={running} />{' '}
            noiseSuppression
          </label>
        </div>

        <div style={{ ...row, marginTop: 16 }}>
          <label style={label}>
            tone Hz
            <input
              type="number"
              value={freq}
              min={100}
              max={8000}
              onChange={e => setFreq(Number(e.target.value))}
              disabled={running}
              style={{ width: 90 }}
            />
          </label>
          <label style={label}>
            gain 0–1
            <input
              type="number"
              value={gain}
              min={0}
              max={1}
              step={0.05}
              onChange={e => setGain(Number(e.target.value))}
              style={{ width: 90 }}
            />
          </label>
          <label style={label}>
            burst ms
            <input
              type="number"
              value={burstMs}
              step={250}
              onChange={e => setBurstMs(Number(e.target.value))}
              disabled={running}
              style={{ width: 90 }}
            />
          </label>
          <label style={label}>
            gap ms
            <input
              type="number"
              value={gapMs}
              step={250}
              onChange={e => setGapMs(Number(e.target.value))}
              disabled={running}
              style={{ width: 90 }}
            />
          </label>
        </div>

        <div style={{ ...row, marginTop: 16 }}>
          {running ? <button onClick={stop}>stop</button> : <button onClick={start}>start</button>}
          <button onClick={copyJson} disabled={!samples.length}>
            copy JSON ({samples.length} samples)
          </button>
          {running && (
            <span style={{ color: bursting ? '#3fb950' : '#8b949e' }}>
              {bursting ? '● tone playing' : '○ silent gap'}
            </span>
          )}
        </div>

        {error && <p style={{ color: '#f85149', whiteSpace: 'pre-wrap' }}>{error}</p>}
      </div>

      <div style={box}>
        <div style={{ color: verdictColour, fontSize: 16, marginBottom: 12 }}>
          {verdictText}
          {verdict === 'working' && ' — this is a reproduced echo path'}
        </div>
        <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[
              ['echoReturnLossEnhancement', fmt(latest?.echoReturnLossEnhancement, 6)],
              ['echoReturnLoss', fmt(latest?.echoReturnLoss, 4)],
              ['ERLE distinct values', String(analysis.erleValues)],
              [
                'ERLE min → max',
                Number.isFinite(analysis.erleMin) ? `${fmt(analysis.erleMin, 4)} → ${fmt(analysis.erleMax, 4)}` : '—',
              ],
              ['audioLevel (now)', fmt(latest?.audioLevel, 4)],
              ['clipped to 1.0 at any point', analysis.clipped ? 'YES — AEC cannot model a clipped path' : 'no'],
              [
                'mic RMS during tone',
                analysis.dOn !== undefined ? `${analysis.dOn.toFixed(1)} dBov (n=${analysis.nOn})` : '—',
              ],
              [
                'mic RMS during silence',
                analysis.dOff !== undefined ? `${analysis.dOff.toFixed(1)} dBov (n=${analysis.nOff})` : '—',
              ],
              [
                'echo delta',
                analysis.delta !== undefined
                  ? `${analysis.delta >= 0 ? '+' : ''}${analysis.delta.toFixed(1)} dB${
                      analysis.delta > 6 ? '  ← return path present' : analysis.delta < -3 ? '  ← no return path' : ''
                    }`
                  : '—',
              ],
            ].map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: '3px 20px 3px 0', color: '#8b949e' }}>{k}</td>
                <td style={{ padding: '3px 0' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={box}>
        <div style={{ color: '#8b949e', fontSize: 13, marginBottom: 8 }}>
          applied track settings (what the browser did)
        </div>
        <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>
          {micLabel ? `${micLabel}\n` : ''}
          {appliedSettings ? JSON.stringify(appliedSettings, null, 2) : '—'}
        </pre>
      </div>

      <audio ref={audioElRef} autoPlay />
    </div>
  );
};
