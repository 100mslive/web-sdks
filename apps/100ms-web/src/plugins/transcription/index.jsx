import { useEffect, useRef, useState } from "react";
import { Button } from "@100mslive/hms-video-react";
import RecordRTC, { StereoAudioRecorder } from "recordrtc";
import { useHMSStore, selectRoom } from "@100mslive/react-sdk";
import Pusher from "pusher-js";
import { Text, Box, Tooltip } from "@100mslive/react-ui";

const pusher = new Pusher(process.env.REACT_APP_TRANSCRIPTION_PUSHER_APP_KEY, {
  cluster: "ap2",
  authEndpoint: process.env.REACT_APP_TRANSCRIPTION_PUSHER_AUTHENDPOINT,
});
let channel = null;

export function TranscriptionButton() {
  const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speakingPeer, setSpeakingPeer] = useState("");
  const transcriber = useRef(null);
  const roomId = useHMSStore(selectRoom)?.id;
  useEffect(() => {
    channel = pusher.subscribe(`private-${roomId}`);
    channel.bind(`client-transcription`, ({ text }) => {
      if (text) {
        let data = JSON.parse(text);
        if (data && data.setTranscriptionStatus) {
          !isTranscriptionEnabled &&
          data.setTranscriptionStatus.setStatus === true
            ? enableTranscription()
            : data.setTranscriptionStatus.setStatus === false
            ? enableTranscription(false)
            : null;
        } else if (data && data.peername && data.transcript != "") {
          setTranscript(data.transcript);
          setSpeakingPeer("[" + data.peername + "]");
          if (data.isenabled === true && !isTranscriptionEnabled) {
            enableTranscription();
          }
          setTimeout(() => {
            setTranscript("");
            setSpeakingPeer("");
          }, 5000);
        }
      }
    });
  }, [roomId]);

  const enableTranscription = (setStatus = null) => {
    if (!transcriber.current) {
      transcriber.current = new Transcriber(setTranscript, setSpeakingPeer);
      transcriber.current.enabled = false;
    }
    let setFeature = setStatus === false ? setStatus : !isTranscriptionEnabled;
    transcriber.current.enableTranscription(setFeature);
    setIsTranscriptionEnabled(setFeature);
  };

  return (
    <>
      <Box
        css={{
          textAlign: "left",
          fontWeight: "$medium",
          bottom: "120px",
          position: "fixed",
          width: "100%",
          fontSize: "$20px",
          zIndex: "1000000",
          color: "white",
          textShadow: "0px 0px 6px #000",
          whiteSpace: "pre-line",
          paddingLeft: "40px",
        }}
      ></Box>
      <Box
        css={{
          textAlign: "center",
          fontWeight: "$medium",
          bottom: "90px",
          position: "fixed",
          width: "100%",
          fontSize: "$20px",
          zIndex: "1000000",
          color: "white",
          textShadow: "0px 0px 6px #000",
          whiteSpace: "pre-line",
        }}
      >
        <Text
          css={{
            color: "white",
            textShadow: "0px 0px 6px #000",
          }}
        >
          {transcript}
        </Text>
        <Text
          css={{
            color: "#c0bbbb",
            textShadow: "0px 0px 6px #000",
          }}
        >
          {speakingPeer}
        </Text>
      </Box>
      <Button
        iconOnly
        variant="no-fill"
        shape="rectangle"
        active={isTranscriptionEnabled}
        onClick={enableTranscription}
        key="transcribe"
      >
        <Tooltip
          title={`Turn ${!isTranscriptionEnabled ? "on" : "off"} transcription`}
        >
          <span>
            <b>T</b>
          </span>
        </Tooltip>
      </Button>
    </>
  );
}
class Transcriber {
  constructor(setTranscript, setSpeakingPeer) {
    this.enabled = false;
    this.socket = null;
    this.totalTimeDiff = 0;
    this.totalCount = 0;
    this.streams = {};
    this.setTranscript = setTranscript;
    this.setSpeakingPeer = setSpeakingPeer;
    this.initialized = false;
    this.lastMessage = {};
    this.localPeerId = null;
    this.sttTuningConfig = {
      timeSlice: 250,
      desiredSampRate: 8000,
      numberOfAudioChannels: 1,
      bufferSize: 256,
    };
  }

  broadcast = (text, eventName = "transcription") => {
    channel.trigger(`client-${eventName}`, { text, eventName });
  };

  async listen() {
    try {
      const localPeer = window.__hms.sdk.getLocalPeer();
      this.localPeerId = localPeer.peerId;
      this.streams[localPeer.peerId] = {
        stream: new MediaStream([localPeer.audioTrack.nativeTrack]),
        name: localPeer.name,
      };

      let url = process.env.REACT_APP_DYNAMIC_STT_TOKEN_GENERATION_ENDPOINT;
      let res = await fetch(url);
      let body = await res.json();
      if (body && body.token) {
        const token = body.token;
        this.socket = await new WebSocket(
          `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${this.sttTuningConfig.desiredSampRate}&token=${token}`
        );
        this.setTranscript("");
        this.socket.onmessage = message => {
          const res = JSON.parse(message.data);
          if (res.text && this.enabled) {
            let peername = this.streams[this.localPeerId]["name"];
            peername = peername
              .toLowerCase()
              .replace(/(^\w{1})|(\s{1}\w{1})/g, match => match.toUpperCase());
            let messageText =
              res.text.length >= 80
                ? res.text
                    .split(" ")
                    .slice(Math.max(res.text.split(" ").length - 10, 1))
                    .join(" ")
                : res.text;
            this.setTranscript(messageText);
            this.setSpeakingPeer("[You]");
            setTimeout(() => {
              this.setTranscript("");
              this.setSpeakingPeer("");
            }, 5000);
            this.broadcast(
              JSON.stringify({
                peername: peername,
                transcript: messageText,
                isenabled: this.enabled,
              })
            );
          }
        };

        this.socket.onerror = event => {
          console.error(event);
          this.socket.close();
        };

        this.socket.onclose = event => {
          console.log(event);
          this.socket = null;
          if (this.enabled) {
            this.listen();
          }
        };

        this.socket.onopen = () => {
          for (let i in this.streams) {
            this.observeStream(this.streams[i]["stream"]);
          }
        };
      } else {
        console.log("Unable to fetch dynamic token!!");
      }
    } catch (err) {
      console.log(err);
    }
  }

  observeStream(stream) {
    let recorder = new RecordRTC(stream, {
      ...this.sttTuningConfig,
      type: "audio",
      mimeType: "audio/webm;codecs=pcm",
      recorderType: StereoAudioRecorder,
      ondataavailable: blob => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64data = reader.result;
          if (
            this.socket &&
            this.enabled &&
            this.socket.readyState &&
            this.socket.readyState === 1
          ) {
            try {
              this.socket.send(
                JSON.stringify({ audio_data: base64data.split("base64,")[1] })
              );
            } catch (err) {
              console.log(err);
            }
          }
        };
        reader.readAsDataURL(blob);
      },
    });
    recorder.startRecording();
  }

  enableTranscription(enable) {
    if (enable && !this.enabled) {
      this.enabled = true;
      this.listen();
      this.broadcast(
        JSON.stringify({ setTranscriptionStatus: { setStatus: true } })
      );
    } else if (!enable && this.enabled) {
      this.broadcast(
        JSON.stringify({ setTranscriptionStatus: { setStatus: false } })
      );
      this.enabled = false;
      this.socket.close();
      this.socket = null;
      setTimeout(() => {
        this.setTranscript("");
      }, 200);
    }
  }
}
