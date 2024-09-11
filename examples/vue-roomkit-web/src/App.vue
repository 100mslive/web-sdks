<template>
  <div id="form" v-if="showInputForm">
    <p>Join a 100ms room</p>
    <input
      id="room-code-field"
      v-model="roomCode"
      type="text"
      placeholder="Enter a room code"
    />
    <button id="btn" @click="renderHmsPrebuilt">Submit</button>
  </div>
  <div id="app">
    <hms-prebuilt v-if="showHmsPrebuilt" :room-code="roomCode"></hms-prebuilt>
  </div>
</template>

<script>
import '@100mslive/roomkit-web';

export default {
  data() {
    return {
      roomCode: '',
      showHmsPrebuilt: false,
      showInputForm: true,
    };
  },
  methods: {
    renderHmsPrebuilt() {
      this.showHmsPrebuilt = true;
      this.showInputForm = false;
    },
    resetPage() {
      this.showHmsPrebuilt = false;
      this.showInputForm = true;
    },
  },
};
</script>

<style>
body {
  font-family: sans-serif;
  margin: 0;
}

#form {
  background-color: black;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

#btn {
  padding: 0.5rem;
  background-color: #2572ed;
  color: white;
  border-radius: 0.25rem;
  width: 10rem;
  border: none;
}

#room-code-field {
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 2px solid #2572ed;
  background: none;
  color: white;
  text-align: center;
}

#app {
  height: 100vh;
}
</style>
