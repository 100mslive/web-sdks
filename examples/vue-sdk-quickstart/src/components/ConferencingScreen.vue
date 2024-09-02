<script setup>
import { onMounted } from 'vue'
import { selectPeers } from '@100mslive/vue-sdk'

const peers = useHMSStore(selectPeers);
</script>

<template>
  <div class="container">
    <video ref="video"></video>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}
video {
  width: 320px;
  height: auto;
}
</style>
