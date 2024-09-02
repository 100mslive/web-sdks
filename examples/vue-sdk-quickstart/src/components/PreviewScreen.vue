<script setup>
import { onMounted, ref, inject, watchEffect } from 'vue'
import {
  selectLocalVideoTrackID,
  selectIsLocalVideoEnabled,
  selectIsLocalAudioEnabled,
  selectRoomState,
  HMSRoomState
} from '@100mslive/vue-sdk'

function isRoomCode(str) {
  const regex = /^[A-Za-z]*(-[A-Za-z]*){2}$/
  return regex.test(str)
}

const getRoomCodeFromUrl = () => {
  const path = window.location.pathname
  const regex = /(\/streaming)?(\/(preview|meeting))?\/(?<code>[^/]+)/
  const roomCode = path.match(regex)?.groups?.code || null
  return isRoomCode(roomCode) ? roomCode : null
}

const video = ref(null)
const hmsActions = inject('hmsActions')
const useHMSStore = inject('useHMSStore')
const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled)
const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled)
const localVideoTrackId = useHMSStore(selectLocalVideoTrackID)
const roomState = useHMSStore(selectRoomState)

function toggleVideo() {
  hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled.value)
}

function toggleAudio() {
  hmsActions.setLocalVideoEnabled(!isLocalAudioEnabled.value)
}

watchEffect(async () => {
  if (localVideoTrackId.value && video.value && roomState.value === HMSRoomState.Preview) {
    if (isLocalVideoEnabled.value) {
      await hmsActions.attachVideo(localVideoTrackId.value, video.value)
    } else {
      await hmsActions.detachVideo(localVideoTrackId.value, video.value)
    }
  }
})

onMounted(async () => {
  const roomCode = getRoomCodeFromUrl()
  if (!roomCode) {
    alert('please pass room code in the url')
  }
  const token = await hmsActions.getAuthTokenByRoomCode({ roomCode })
  await hmsActions.preview({
    authToken: token,
    userName: 'test'
  })
})
</script>

<template>
  <div class="container">
    <video ref="video"></video>
    <div>{{ isLocalVideoEnabled }}</div>
    <div class="actions-container">
      <button @click="toggleAudio">toggle audio</button>
      <button @click="toggleVideo">toggle video</button>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  position: relative;
}
video {
  width: 320px;
  height: auto;
}
.actions-container {
  display: flex;
  gap: 8;
}
</style>
