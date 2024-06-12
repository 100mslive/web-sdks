import {
  HMSReactiveStore,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectPeers,
  selectIsPeerAudioEnabled,
  selectIsPeerVideoEnabled,
  selectIsLocalScreenShared,
  selectScreenShareByPeerID,
  selectPeersScreenSharing,
  selectPeerNameByID,
  selectLocalPeerID,
  selectIsLocalAudioPluginPresent,
  selectRoomState,
  HMSRoomState,
} from '@100mslive/hms-video-store';
import { HMSEffectsPlugin } from '@100mslive/hms-virtual-background';
import { HMSKrispPlugin } from '@100mslive/hms-noise-cancellation';

// Initialize HMS Store
const hmsManager = new HMSReactiveStore();
hmsManager.triggerOnSubscribe();
const hmsStore = hmsManager.getStore();
const hmsActions = hmsManager.getActions();
const plugin = new HMSKrispPlugin();
let effectsPlugin;

// HTML elements
const form = document.getElementById('join');
const previewBtn = document.getElementById('preview-btn');
const previewBtnContent = previewBtn.innerHTML;
const header = document.getElementsByTagName('header')[0];
const conference = document.getElementById('conference');
const peersContainer = document.getElementById('peers-container');
const leaveBtn = document.getElementById('leave-btn');
const muteAudio = document.getElementById('mute-aud');
const muteVideo = document.getElementById('mute-vid');
const toggleScreenshare = document.getElementById('toggle-screenshare');
const toggleNC = document.getElementById('toggle-nc');
const controls = document.getElementById('controls');

// store peer IDs already rendered to avoid re-render on mute/unmute
const renderedPeerIDs = new Set();
// Maintain a mapping from peer IDs to their corresponding screenshare track IDs
const renderedScreenshareIDs = new Map();

// Joining the preview
previewBtn.onclick = async () => {
  previewBtn.innerHTML = `Loading preview...`;
  previewBtn.style.opacity = 0.8;
  const userName = document.getElementById('name').value;
  const roomCode = document.getElementById('room-code').value;
  // use room code to fetch auth token
  const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode });
  const config = { userName, authToken };
  await hmsActions.preview(config);
  const effectsKey = hmsStore.getState().room;
  effectsPlugin = new HMSEffectsPlugin(effectsKey.effectsKey, () => {
    setTimeout(async () => {
      await hmsActions.join(config);
    }, 2000);
  });
  effectsPlugin.setBackground(
    'https://images.unsplash.com/photo-1715954410040-37496c8aa689?q=80&w=3002&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  );
  await hmsActions.addPluginsToVideoStream([effectsPlugin]);
  await effectsPlugin.preload();
};

// Leaving the room
async function leaveRoom() {
  await hmsActions.leave();
  peersContainer.innerHTML = '';
}

const toggleKrisp = async () => {
  const isPluginAdded = hmsStore.getState(selectIsLocalAudioPluginPresent(plugin.getName()));

  if (isPluginAdded) {
    plugin.toggle();
  } else {
    await hmsActions.addPluginToAudioTrack(plugin);
  }

  toggleNC.classList.toggle('highlight');
};
toggleNC.onclick = toggleKrisp;
// Cleanup if user refreshes the tab or navigates away
window.onunload = window.onbeforeunload = leaveRoom;
leaveBtn.onclick = leaveRoom;

// Helper function to create html elements
function createElementWithClass(tag, className) {
  const newElement = document.createElement(tag);
  newElement.className = className;
  return newElement;
}

// Render a single peer
async function renderPeer(peer) {
  const peerTileDiv = createElementWithClass('div', 'peer-tile');
  const videoElement = createElementWithClass('video', 'peer-video');
  const peerTileName = createElementWithClass('div', 'peer-name');
  const peerAudioMuted = createElementWithClass('div', 'peer-audio-muted');
  const peerVideoMuted = createElementWithClass('div', 'peer-video-muted');
  videoElement.autoplay = true;
  videoElement.muted = true;
  videoElement.playsinline = true;
  peerTileName.textContent = peer.name + (peer.isLocal ? ' (You)' : '');
  peerTileDiv.append(videoElement);
  peerTileDiv.append(peerTileName);
  peerTileDiv.append(peerAudioMuted);
  peerTileDiv.append(peerVideoMuted);
  peerTileDiv.id = `peer-tile-${peer.id}`;
  hmsStore.subscribe(enabled => {
    peerAudioMuted.style.display = enabled ? 'none' : 'flex';
    peerAudioMuted.innerHTML = `<span class="material-symbols-outlined">
      ${enabled ? 'mic' : 'mic_off'}
   </span>`;
  }, selectIsPeerAudioEnabled(peer.id));
  hmsStore.subscribe(enabled => {
    peerVideoMuted.style.display = enabled ? 'none' : 'flex';
    peerVideoMuted.innerHTML = `<span class="material-symbols-outlined video-status">
           ${enabled ? 'videocam' : 'account_circle'}
        </span>
      `;
  }, selectIsPeerVideoEnabled(peer.id));
  await hmsActions.attachVideo(peer.videoTrack, videoElement);
  return peerTileDiv;
}

async function renderScreenshare(screenshareID, peerID) {
  const localPeerID = hmsStore.getState(selectLocalPeerID);
  renderedScreenshareIDs.set(peerID, screenshareID);
  const peerName = hmsStore.getState(selectPeerNameByID(peerID));
  const screenshareTileDiv = createElementWithClass('div', 'peer-tile');
  const screenshareTileName = createElementWithClass('div', 'peer-name');
  const videoElement = createElementWithClass('video', 'peer-video');
  videoElement.autoplay = true;
  videoElement.muted = true;
  videoElement.playsinline = true;
  screenshareTileName.textContent = `Shared by ${localPeerID === peerID ? 'you' : peerName}`;
  screenshareTileDiv.append(videoElement);
  screenshareTileDiv.append(screenshareTileName);
  screenshareTileDiv.id = `screen-share-tile-${peerID}`;
  await hmsActions.attachVideo(screenshareID, videoElement);
  return screenshareTileDiv;
}

// display a tile for each peer in the peer list
function renderPeers(peers) {
  const currentPeerIds = new Set(peers.map(peer => peer.id));
  // remove peers that are not present
  renderedPeerIDs.forEach(peerId => {
    if (!currentPeerIds.has(peerId)) {
      document.getElementById(`peer-tile-${peerId}`)?.remove();
    }
  });

  peers.forEach(async peer => {
    if (!renderedPeerIDs.has(peer.id) && peer.videoTrack) {
      renderedPeerIDs.add(peer.id);
      peersContainer.append(await renderPeer(peer));
    }
  });
}

// Reactive state - renderPeers is called whenever there is a change in the peer-list
hmsStore.subscribe(renderPeers, selectPeers);

hmsStore.subscribe(screensharingPeers => {
  const currentScreenShareIDs = new Map();
  screensharingPeers.forEach(peer => {
    const screenshareID = hmsStore.getState(selectScreenShareByPeerID(peer.id)).id;
    currentScreenShareIDs.set(peer.id, screenshareID);
  });

  // Remove screenshare tiles for peers who have stopped screensharing or left
  renderedScreenshareIDs.forEach((_, peerID) => {
    if (!currentScreenShareIDs.has(peerID)) {
      document.getElementById(`screen-share-tile-${peerID}`).remove();
      renderedScreenshareIDs.delete(peerID);
    }
  });

  currentScreenShareIDs.forEach(async (screenshareID, peerID) => {
    if (!renderedScreenshareIDs.has(peerID)) {
      if (screenshareID) {
        peersContainer.append(await renderScreenshare(screenshareID, peerID));
      }
    }
  });
}, selectPeersScreenSharing);

// Mute and unmute audio
muteAudio.onclick = () => {
  const audioEnabled = !hmsStore.getState(selectIsLocalAudioEnabled);
  hmsActions.setLocalAudioEnabled(audioEnabled);
  muteAudio.classList.toggle('highlight');
  muteAudio.innerHTML = `<span class="material-symbols-outlined">
           ${audioEnabled ? 'mic' : 'mic_off'}
        </span>
      `;
};

// Mute and unmute video
muteVideo.onclick = () => {
  const videoEnabled = !hmsStore.getState(selectIsLocalVideoEnabled);
  hmsActions.setLocalVideoEnabled(videoEnabled);
  muteVideo.classList.toggle('highlight');
  muteVideo.innerHTML = `<span class="material-symbols-outlined">
           ${videoEnabled ? 'videocam' : 'videocam_off'}
        </span>
      `;
};

// Toggle local screenshare
toggleScreenshare.onclick = async () => {
  const isLocalScreenshared = hmsStore.getState(selectIsLocalScreenShared);
  await hmsActions.setScreenShareEnabled(!isLocalScreenshared);
  toggleScreenshare.classList.toggle('highlight');
  toggleScreenshare.innerHTML = `<span class="material-symbols-outlined">
           ${isLocalScreenshared ? 'screen_share' : 'stop_screen_share'}
        </span>
      `;
};

// Showing the required elements on connection/disconnection
function onRoomStateChange(roomState) {
  const roomElements = [header, conference, controls, leaveBtn];
  const loader = document.getElementsByClassName('loading')[0];
  const previewElements = [];
  if ([HMSRoomState.Preview, HMSRoomState.Connected].includes(roomState)) {
    form.classList.add('hide');
    previewBtn.innerHTML = previewBtnContent;
    previewBtn.style.opacity = 1;
    if (roomState === HMSRoomState.Preview) {
      previewElements.forEach(element => element.classList.remove('hide'));
      loader.classList.remove('hide');
    } else {
      previewElements.forEach(element => element.classList.add('hide'));
      roomElements.forEach(element => element.classList.remove('hide'));
      loader.classList.add('hide');
      renderPeers(hmsStore.getState(selectPeers));
    }
  } else if (roomState !== HMSRoomState.Connecting) {
    previewElements.forEach(element => element.classList.add('hide'));
    form.classList.remove('hide');
    roomElements.forEach(element => element.classList.add('hide'));
  }
}

// Listen to the connection state
hmsStore.subscribe(onRoomStateChange, selectRoomState);
