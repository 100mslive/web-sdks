import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { hmsVuePlugin } from '@100mslive/vue-sdk';

const app = createApp(App);
app.use(hmsVuePlugin)
app.mount('#app')