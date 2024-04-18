import React, { useEffect, useState } from 'react';
import { HMSTranscript, selectPeerNameByID, useHMSStore, useTranscript } from '@100mslive/react-sdk';
import { Flex } from '../../Layout';
import { Text } from '../../Text';

interface CaptionQueueData extends HMSTranscript {
  transcriptQueue: SimpleQueue;
}

interface TranscriptData extends HMSTranscript {
  timeout?: NodeJS.Timeout | undefined;
}
class SimpleQueue {
  private storage: TranscriptData[] = [];
  constructor(private capacity: number = 3, private MAX_STORAGE_TIME: number = 5000) {}
  enqueue(data: TranscriptData): void {
    if (this.size() === this.capacity && this.storage[this.size() - 1].final) {
      this.dequeue(this.storage[this.size() - 1]);
    }
    if (this.size() === 0) {
      this.storage.push(data);
      this.addTimeout(this.storage[this.size() - 1], data.final);
      return;
    }
    if (this.size() > 0 && this.storage[this.size() - 1]?.final === true) {
      this.storage.push(data);
      this.addTimeout(this.storage[this.size() - 1], data.final);
      return;
    }
    this.storage[this.size() - 1].transcript = data.transcript;
    this.storage[this.size() - 1].final = data.final;
    this.storage[this.size() - 1].end = data.end;
    this.addTimeout(this.storage[this.size() - 1], data.final);
  }
  addTimeout(item: TranscriptData, isFinal: boolean) {
    if (!isFinal) {
      return;
    }
    item.timeout = setTimeout(() => {
      this.dequeue(item);
    }, this.MAX_STORAGE_TIME);
  }
  dequeue(item: TranscriptData): TranscriptData | undefined {
    const index = this.storage.indexOf(item);
    if (index === -1) {
      return undefined;
    }
    const removedItem = this.storage.splice(index, 1);
    if (removedItem.length <= 0) {
      return undefined;
    }
    this.clearTimeout(removedItem[0]);
    return item;
  }
  clearTimeout(item: TranscriptData) {
    if (!item.timeout) {
      return;
    }
    clearTimeout(item.timeout);
  }
  peek(): TranscriptData | undefined {
    if (this.size() <= 0) {
      return undefined;
    }
    return this.storage[0];
  }
  getTranscription(): string {
    let script = '';
    this.storage.forEach((value: TranscriptData) => (script += value.transcript + ' '));
    return script;
  }
  reset() {
    this.storage.length = 0;
  }
  size(): number {
    return this.storage.length;
  }
}
class Queue {
  private storage: Record<string, CaptionQueueData> = {};
  constructor(private capacity: number = 3) {}

  enqueue(data: HMSTranscript): void {
    if (this.size() === this.capacity) {
      this.dequeue();
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
      this.storage[data.peer_id].transcriptQueue.enqueue(data as TranscriptData);
      return;
    }
    this.storage[data.peer_id].transcriptQueue.enqueue(data as TranscriptData);
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
  const peerName = useHMSStore(selectPeerNameByID(peer_id)) || 'Participant';
  data = data.trim();
  if (!data) return null;
  return (
    <Text
      variant="body2"
      css={{
        fontWeight: '$normal',
      }}
    >
      {`${peerName}: ${data}`}
    </Text>
  );
};

export const CaptionsViewer = () => {
  const [captionQueue] = useState<CaptionMaintainerQueue>(new CaptionMaintainerQueue());
  const [currentData, setCurrentData] = useState<{ [key: string]: string }[]>([]);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      if (!captionQueue) {
        return;
      }
      const data = captionQueue.captionData?.findPeerData();
      setCurrentData(data);
    }, 1000);
    return () => clearInterval(timeInterval);
  }, [captionQueue]);

  useTranscript({
    onTranscript: (data: HMSTranscript[]) => {
      captionQueue && captionQueue.push(data as HMSTranscript[]);
    },
  });
  const dataToShow = currentData.filter((data: { [key: string]: string }) => {
    const key = Object.keys(data)[0];
    if (data[key]) {
      return true;
    }
    return false;
  });
  if (dataToShow.length <= 0) {
    return null;
  }
  return (
    <Flex direction="column">
      {dataToShow.map((data: { [key: string]: string }, index: number) => {
        const key = Object.keys(data)[0];
        return <TranscriptView key={index} peer_id={key} data={data[key]} />;
      })}
    </Flex>
  );
};
