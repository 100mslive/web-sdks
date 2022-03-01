import { useEffect, useRef, useState } from "react";
import { Button } from "@100mslive/hms-video-react";
import RecordRTC,  { StereoAudioRecorder } from 'recordrtc';
import { useHMSStore, selectRoom } from "@100mslive/react-sdk";
import Pusher from "pusher-js";
import { Text } from "@100mslive/react-ui";

const pusher = new Pusher("c6edf1e636510f716f39", {
  cluster: "ap2",
  authEndpoint: "https://whiteboard-server-git-transcription-100mslive.vercel.app/api/pusher/auth",
});
let channel = null;

function setTranscript(text = ""){
  document.getElementById("voiceContent").innerText = text
}

export function TranscriptionButton() {
  const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(false);
  const transcriber = useRef(null);
  const roomId = useHMSStore(selectRoom)?.id;
  useEffect(() => {
    channel = pusher.subscribe(`private-${roomId}`);
    channel.bind(`client-transcription`, ({text}) => {
      setTranscript(text)
      setTimeout(() => {
        setTranscript()
      }, 5000);
    });
  }, [roomId])

  const enableTranscription = () => {
    if (!transcriber.current) {
      transcriber.current = new Transcriber(roomId);
      transcriber.current.enabled = false;
    }
    transcriber.current.enableTranscription(!isTranscriptionEnabled);
    setIsTranscriptionEnabled(!isTranscriptionEnabled);
  };

  return (
    <>
      <Text id="voiceContent" className="transcribe"></Text>
      <Button
        iconOnly
        variant="no-fill"
        shape="rectangle"
        active={isTranscriptionEnabled}
        onClick={enableTranscription}
        key="transcribe"
      >
        <span title="Transcribe">
          <b>T</b>
        </span>
      </Button>
    </>
  );
}
class Transcriber {
  constructor(roomId) {
    this.enabled = false;
    this.socket = null;
    this.totalTimeDiff = 0
    this.totalCount = 0
    this.allstreams = {};
    this.streams = {}
    this.roomId = roomId;
    this.initialized = false;
    this.lastMessage = {};
    this.localPeerId = null;
  }

  broadcast = (text, eventName = "transcription") => {
    channel.trigger(
      `client-${eventName}`,
      { text, eventName }
    );
  };

  async listen(){
    try {
      this.allstreams = window.__hms.sdk.getPeers()
      this.allstreams.map(p => {
        if(p.isLocal){
          this.localPeerId = p.peerId
          this.streams[p.peerId] = { "stream" : new MediaStream([p.audioTrack.nativeTrack]) , "name" : p.name}
        }
      }).filter(x => !!x)
      let url = process.env.REACT_APP_DYNAMIC_STT_TOKEN_GENERATION_ENDPOINT
      let res = await fetch(url);
      let body = await res.json();
      if(body && body.token){
        const token = body.token
        this.socket = await new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=8000&token=${token}`);
        setTranscript()
        this.socket.onmessage = (message) => {
            const res = JSON.parse(message.data);
            if(res.text && this.enabled){
              let peername = this.streams[this.localPeerId]["name"]
              peername = peername.toLowerCase().replace(/(^\w{1})|(\s{1}\w{1})/g, match => match.toUpperCase());
              this.broadcast(res.text + "\n[" + peername + "]")
            }
        };
  
        this.socket.onerror = (event) => {
            console.error(event);
            this.socket.close();
        }
  
        this.socket.onclose = event => {
            console.log(event);
            this.socket = null;
            if(this.enabled){
              this.listen()
            }
        }
  
        this.socket.onopen = () => {
          document.getElementById("voiceContent").style.display = '';
          for(let i in this.streams) {
            this.observeStream(this.streams[i]["stream"], this.streams[i]["name"]);
          }
        };
      }else{
        console.log("Unable to fetch dynamic token!!")
      }
    } catch (err) {
      console.log(err)
    }
  }

  observeStream(stream, name = "") {
    let recorder = new RecordRTC(stream, {
      type: 'audio',
      mimeType: 'audio/webm;codecs=pcm',
      recorderType: StereoAudioRecorder,
      timeSlice: 250,
      desiredSampRate: 8000,
      numberOfAudioChannels: 1,
      bufferSize: 256,
      ondataavailable: (blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64data = reader.result;
          if (this.socket && this.enabled && this.socket.readyState && this.socket.readyState === 1) {
            try{
              this.socket.send(JSON.stringify({ audio_data: base64data.split('base64,')[1] }));
            } catch (err) {
              console.log(err)
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
      setTranscript("[ Initializing Transcription.. ]");
      this.enabled = true;
      this.listen()
    } else if (!enable && this.enabled) {
      this.enabled = false;
      this.socket.close();
      this.socket = null;
      setTimeout(function(){
        setTranscript();
      }, 200);
    }
  }
}
