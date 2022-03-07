// @ts-check
import { createEffect } from 'solid-js';
import { selectRoom, useHMSActions, useHMSStore } from '@100mslive/solid-sdk';
import JoinForm from './components/JoinForm';
import Header from './components/Header';
import Conference from './components/Conference';
import Footer from './components/Footer';
import './styles.css';

export default function App() {
  const room = useHMSStore(selectRoom);
  const hmsActions = useHMSActions();

  createEffect(() => {
    window.onunload = () => {
      if (room.isConnected) {
        hmsActions.leave();
      }
    };
  });

  return (
    <div className="App">
      <Header />
      {room.isConnected ? (
        <>
          <Conference />
          <Footer />
        </>
      ) : (
        <JoinForm />
      )}
    </div>
  );
}
