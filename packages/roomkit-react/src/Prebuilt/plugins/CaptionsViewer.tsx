import React, { useEffect, useState } from 'react';
import { selectPeerNameByID, useCustomEvent, useHMSStore } from '@100mslive/react-sdk';
import { Flex } from '../../Layout';
import { Text } from '../../Text';

interface CaptionData {
  start: number;
  end: number;
  peer_id: string;
  final: boolean;
  transcript: string;
  transcriptQueue: SimpleQueue;
}

interface Transcript {
  transcript: string;
  final: boolean;
}
class SimpleQueue {
  private storage: Transcript[] = [];
  constructor(private capacity: number = 3) {}
  enqueue(value: string, final: boolean): void {
    if (!value) {
      return;
    }
    if (this.size() === this.capacity && this.storage[this.size() - 1].final) {
      this.dequeue();
    }
    if (this.size() <= 0 || this.storage[this.size() - 1]?.final) {
      this.storage.push({
        transcript: value,
        final: final,
      });
      return;
    }
    this.storage[this.size() - 1].transcript = value;
    this.storage[this.size() - 1].final = final;
  }
  dequeue(): Transcript | undefined {
    if (this.size() <= 0) {
      return undefined;
    }
    return this.storage.shift();
  }
  peek(): Transcript | undefined {
    if (this.size() <= 0) {
      return undefined;
    }
    return this.storage[0];
  }
  getTranscription(): string {
    let script = '';
    this.storage.forEach((value: Transcript) => (script += value.transcript + ' '));
    return script;
  }
  size(): number {
    return this.storage.length;
  }
}
class Queue {
  private storage: { [key: string]: CaptionData[] } = {};
  constructor(private capacity: number = 3) {}

  enqueue(key: string, value: CaptionData): void {
    if (this.size() === this.capacity) {
      this.dequeue();
    }
    if (!value.transcriptQueue) {
      value.transcriptQueue = new SimpleQueue();
    }
    value.transcriptQueue.enqueue(value.transcript, value.final);
    if (!this.storage[key]) {
      this.storage[key] = [value];
      return;
    }
    // this.storage[key].push(value);
  }
  dequeue(): CaptionData[] {
    const key: string = Object.keys(this.storage).shift() || '';
    const captionData = this.storage[key];
    delete this.storage[key];
    return captionData || [];
  }

  peek(): CaptionData[] | undefined {
    if (this.size() <= 0) return undefined;
    const key: string = Object.keys(this.storage).shift() || '';
    return this.storage[key];
  }

  findPeerData(): { [key: string]: string }[] {
    const keys = Object.keys(this.storage);
    const data = keys.map((key: string) => {
      const data = this.storage[key];
      let word = '';
      data.forEach((value: CaptionData) => (word = value.transcriptQueue.getTranscription()));
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
  constructor(data: CaptionData[] = []) {
    data.forEach((value: CaptionData) => {
      this.captionData.enqueue(value.peer_id, value);
    });
  }
  push(data: CaptionData[] = []) {
    data.forEach((value: CaptionData) => {
      this.captionData.enqueue(value.peer_id, value);
    });
  }
}
const TranscriptView = ({ peer_id, data }: { peer_id: string; data: string }) => {
  const peerName = useHMSStore(selectPeerNameByID(peer_id));
  if (!data) return null;
  return <Text>{`${peerName}: ${data}`}</Text>;
};
export const CaptionsViewer = () => {
  const captionQueue = new CaptionMaintainerQueue();
  const [currentData, setCurrentData] = useState<{ [key: string]: string }[]>([
    // {
    //   data1: 'Hellow there I am doing great here!!, Hellow there I am doing great here!!',
    // },
    // {
    //   data2: 'Hello there I am not doing great here!!, Hellow there I am doing great here!!',
    // },
  ]);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      const data = captionQueue.captionData.findPeerData();
      setCurrentData(data);
    }, 1000);
    return () => clearInterval(timeInterval);
  });

  useCustomEvent({
    type: 'transcript',
    onEvent: (data: any) => captionQueue.push(data.results),
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
