<script setup>
import PreviewScreen from './components/PreviewScreen.vue'
import ConferencingScreen from './components/ConferencingScreen.vue'
 let showMeetingScreen = false;
</script>

<template>
  <div>
    <preview-screen v-if="!showMeetingScreen"></preview-screen>
  </div>
</template>

<style scoped>

</style>
