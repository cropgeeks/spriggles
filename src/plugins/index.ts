/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from './vuetify'
import pinia from '../stores'
import router from '../router'
import { createPlausible } from 'v-plausible/vue' 

// Types
import type { App } from 'vue'

export function registerPlugins (app: App) {
  app
    .use(vuetify)
    .use(router)
    .use(pinia)
    .use(createPlausible({
      init: {
        domain: 'cropgeeks.github.io/spriggles',
        hashMode: true,
        apiHost: 'https://plausible.hutton.ac.uk',
        trackLocalhost: true,
      },
      settings: {
        enableAutoPageviews: true,
      },
    }))
}
