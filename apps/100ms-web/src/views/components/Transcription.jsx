import { useEffect, useRef, useState } from "react";
import { Button } from "@100mslive/hms-video-react";
import RecordRTC,  { StereoAudioRecorder } from 'recordrtc';
import { useHMSActions, useHMSNotifications } from "@100mslive/react-sdk";

export function TranscriptionButton() {
  const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(false);
  const transcriber = useRef(null);

  //Commenting the Brodcasting part to ensure the local transcription working
  /*const hmsActions = useHMSActions()
  const notification = useHMSNotifications()
  useEffect(() => {
    if(notification && notification.type === "NEW_MESSAGE" && notification.data?.type === "Transcription" && notification.data?.message){
        let showTxt = notification.data.senderName + ": " + notification.data.message
        document.getElementById("speechtxt").innerText = showTxt || ""
        enableTranscription(true)
    }
  }, [notification])*/

  const enableTranscription = () => {
    if (!transcriber.current) {
      transcriber.current = new Transcriber();
      transcriber.current.enabled = false;
      /*transcriber.current.setBroadcast((data) => {
          hmsActions.sendBroadcastMessage(data, "Transcription")
      });*/
    }
    transcriber.current.enableTranscription(!isTranscriptionEnabled);
    setIsTranscriptionEnabled(!isTranscriptionEnabled);
  };

  return (
    <>
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
  constructor() {
    this.broadcast = () => {};
    this.enabled = false;
    this.socket = null;
    this.totalTimeDiff = 0
    this.totalCount = 0
    this.allstreams = {};
    this.streams = {}
  }

  setBroadcast(cb){
    this.broadcast = cb
  }

  displayCaption(text){
    document.getElementById("speechtxt").innerText = text || ""
  }

  async listen(){
    try {
      this.allstreams = window.__hms.sdk.getPeers()
      this.allstreams.map(p => {
        this.streams[p.peerId] = { "stream" : new MediaStream([p.audioTrack.nativeTrack]) , "name" : p.name}
      }).filter(x => !!x)
      let url = process.env.REACT_APP_DYNAMIC_STT_TOKEN_GENERATION_ENDPOINT
      let res = await fetch(url);
      let body = await res.json();
      let cnt = 0;
      if(body && body.token){
        const token = body.token
        this.socket = await new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`);
        const texts = {};
        let startTime,endTime;
        document.getElementById("speechtxt").innerText = ""
        this.socket.onmessage = (message) => {
            const res = JSON.parse(message.data);
            if(res.text && res.text != "" && this.enabled){
              document.getElementById("speechtxt").innerText = res.text;
            }

            //Temporarly Commenting Broadcasting part 
            /*if(res.text != "" && startTime){
              this.broadcast(res.text)
              this.totalCount++
              endTime = performance.now();
              this.totalTimeDiff += (endTime - startTime)
              if(this.totalCount % 100 === 0 || this.totalCount < 2){
                console.log("Average Transcription Latency:", this.totalTimeDiff / this.totalCount, " ms")
              }
            }*/
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
          document.getElementById("speechtxt").style.display = '';
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
      desiredSampRate: 16000,
      numberOfAudioChannels: 1,
      bufferSize: 4096,
      audioBitsPerSecond: 128000,
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
      document.getElementById("speechtxt").innerText = "[ Initializing Transcription.. ]";
      this.enabled = true;
      this.listen()
    } else if (!enable && this.enabled) {
      this.enabled = false;
      this.socket.close();
      this.socket = null;
      setTimeout(function(){
        document.getElementById("speechtxt").innerText = "";
      }, 200);
    }
  }

  processResult(result) {
    if (result.results.length > 0) {
      let transcript = "";
      const startIndex = Math.max(result.results.length - 10, 0);
      for (let i = startIndex; i < result.results.length; ++i) {
        if (!result.results[i].isFinal) {
          transcript += result.results[i][0].transcript;
        }
      }
      const elem = document.getElementById("speechtxt");
      if (elem) {
        elem.innerText = transcript;
      }
    }
  }
}
