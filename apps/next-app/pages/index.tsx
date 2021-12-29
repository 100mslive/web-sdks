import React from 'react';
import { useHMSStore } from '@100mslive/react-sdk';
import { selectIsConnectedToRoom } from '@100mslive/hms-video-store';
import Layout from '../layout/Layout';
import PreviewView from '../components/Preview';
import Room from '../components/Room';

export default function Home() {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  return <Layout>{isConnected ? <Room /> : <PreviewView />}</Layout>;
}
