import React, { useEffect, useState } from 'react';
import { useCustomEvent } from '@100mslive/react-sdk';

interface CaptionData {
  start: number;
  end: number;
  peer_id: string;
  transcript: string;
}
class CaptionMaintainerQueue {
  captionData: CaptionData[] = [];
  startTime;
  RollingFrame = 5000;
  constructor(data: CaptionData[] = []) {
    data.forEach((value: CaptionData) => value.transcript && this.captionData.push(value));
    this.startTime = 0;
  }
  push(data: CaptionData[] = []) {
    data.forEach((value: CaptionData) => value.transcript && this.captionData.push(value));
  }
}
export const CaptionsViewer = () => {
  const captionQueue = new CaptionMaintainerQueue();
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    const timeInterval = setInterval(() => {
      captionQueue.startTime += 1000;
      // cleaner
      captionQueue.captionData = captionQueue.captionData.filter(
        value => value.start >= captionQueue.startTime - captionQueue.RollingFrame,
      );
      setCurrentText('');
      captionQueue.captionData.forEach(value => setCurrentText(currentText + value.transcript));
    }, 1000);
    return () => clearInterval(timeInterval);
  });

  useCustomEvent({
    type: 'transcript',
    onEvent: (data: any) => captionQueue.push(data.results),
  });

  return <p>{currentText}</p>;
};
