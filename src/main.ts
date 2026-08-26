/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

import { registerSW } from 'virtual:pwa-register'

// Styles
import 'unfonts.css'

const updateSW = registerSW({
  onNeedRefresh () {
    console.log('onNeedRefresh')
    document.dispatchEvent(
      new CustomEvent('swUpdated', { detail: updateSW }),
    )
  },
  onOfflineReady () {
    console.log('onOfflineReady')
  },
})

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
