import React, { useEffect, useState } from 'react';
import { HMSTranscript, selectPeerNameByID, useHMSStore, useTranscript } from '@100mslive/react-sdk';
import { Flex } from '../../Layout';
import { Text } from '../../Text';

interface CaptionQueueData extends HMSTranscript {
  transcriptQueue: SimpleQueue;
}

class SimpleQueue {
  private storage: Record<number, HMSTranscript> = {};
  constructor(private index: number = -1, private currentIndex = 0, private MAX_STORAGE_TIME: number = 5000) {}
  enqueue(data: HMSTranscript): void {
    console.log(this.storage);
    if (this.index === -1) {
      this.index++;
      this.storage[this.index] = data;
      if (data.final) {
        setTimeout(() => {
          console.log('clear 2 ', this.storage[this.index]);
          delete this.storage[this.index];
        }, this.MAX_STORAGE_TIME);
      }
      return;
    }
    if (this.index >= 0 && this.storage[this.index]?.final) {
      this.index++;
      this.storage[this.index] = data;
      if (data.final) {
        setTimeout(() => {
          console.log('clear1 ', this.storage[this.index]);
          delete this.storage[this.index];
        }, this.MAX_STORAGE_TIME);
      }
      return;
    }
    this.storage[this.index].transcript = data.transcript;
    this.storage[this.index].final = data.final;
    this.storage[this.index].end = data.end;
    if (data.final) {
      setTimeout(() => {
        console.log('clear ', this.storage[this.index]);
        delete this.storage[this.index];
      }, this.MAX_STORAGE_TIME);
    }
  }
  getTranscription(): string {
    let script = '';
    for (const key in this.storage) {
      script += this.storage[key].transcript + ' ';
    }
    return script;
  }
  reset() {
    this.storage = {};
    this.currentIndex = 0;
    this.index = 0;
  }
}
class Queue {
  private storage: Record<string, CaptionQueueData> = {};
  constructor(private capacity: number = 3) {}

  enqueue(data: HMSTranscript): void {
    if (this.size() === this.capacity) {
      this.dequeue();
    }
    if (data.final) {
      console.log('data ', data);
    }
    if (!this.storage[data.peer_id]) {
      this.storage[data.peer_id] = {
        peer_id: data.peer_id,
        transcript: data.transcript,
        final: data.final,
        transcriptQueue: new SimpleQueue(),
        start: data.start,
        end: data.end,
      };
      this.storage[data.peer_id].transcriptQueue.enqueue(data);
      return;
    }
    this.storage[data.peer_id].transcriptQueue.enqueue(data);
  }
  dequeue(): CaptionQueueData {
    const key: string = Object.keys(this.storage).shift() || '';
    const captionData = this.storage[key];
    captionData.transcriptQueue.reset();
    delete this.storage[key];
    return captionData;
  }

  peek(): CaptionQueueData | undefined {
    if (this.size() <= 0) return undefined;
    const key: string = Object.keys(this.storage).shift() || '';
    return this.storage[key];
  }

  findPeerData(): { [key: string]: string }[] {
    const keys = Object.keys(this.storage);
    const data = keys.map((key: string) => {
      const data = this.storage[key];
      const word = data.transcriptQueue.getTranscription();
      return { [key]: word };
    });
    return data;
  }
  size(): number {
    return Object.keys(this.storage).length;
  }
}

class CaptionMaintainerQueue {
  captionData: Queue = new Queue();
  push(data: HMSTranscript[] = []) {
    data.forEach((value: HMSTranscript) => {
      this.captionData.enqueue(value);
    });
  }
}
const TranscriptView = ({ peer_id, data }: { peer_id: string; data: string }) => {
  const peerName = useHMSStore(selectPeerNameByID(peer_id));
  data = data.trim();
  if (!data) return null;
  return <Text>{`${peerName}: ${data}`}</Text>;
};
export const CaptionsViewer = () => {
  const [captionQueue, setCaptionQueue] = useState<CaptionMaintainerQueue | null>(null);
  const [currentData, setCurrentData] = useState<{ [key: string]: string }[]>([]);

  useEffect(() => {
    setCaptionQueue(new CaptionMaintainerQueue());
  }, []);
  useEffect(() => {
    const timeInterval = setInterval(() => {
      if (!captionQueue) {
        return;
      }
      const data = captionQueue.captionData?.findPeerData();
      setCurrentData(data);
    }, 1000);
    return () => clearInterval(timeInterval);
  });

  useTranscript({
    onTranscript: (data: HMSTranscript[]) => {
      captionQueue && captionQueue.push(data as HMSTranscript[]);
    },
  });

  return (
    <Flex direction="column" gap={1}>
      {currentData.map((data: { [key: string]: string }, index: number) => {
        const key = Object.keys(data)[0];
        return <TranscriptView key={index} peer_id={key} data={data[key]} />;
      })}
    </Flex>
  );
};
