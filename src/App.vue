<template>
  <v-app>
    <v-main class="d-flex flex-column pt-7">
      <v-app-bar
        id="appbar"
        :elevation="2"
        :extended="route.path === '/'"
      >
        <v-img
          id="logo"
          class="ms-4"
          contain
          max-height="64"
          max-width="64"
          src="@/assets/spriggles-full.svg"
        />

        <v-app-bar-title style="cursor: pointer" @click="$router.push('/')">Spriggles</v-app-bar-title>
        <v-spacer />
        <v-btn
          icon="mdi-plus"
          @click="addTab"
        />
        <v-btn
          icon="mdi-file-excel-outline"
          @click="downloadData"
        />
        <v-btn
          icon="mdi-information-outline"
          to="/about"
        />

        <template v-if="route.path === '/'" #extension />
      </v-app-bar>

      <v-container class="app-content">
        <router-view />
      </v-container>

      <v-footer
        class="d-flex align-center justify-center ga-2 flex-wrap flex-grow-1 py-3 mt-auto"
        color="surface-light"
      >
        <v-btn
          v-for="link in links"
          :key="link.text"
          :href="link.href"
          rounded
          :title="link.tooltip"
          :to="link.to"
          variant="text"
          @click="link.click"
        >
          <v-icon
            v-if="link.icon"
            :icon="link.icon"
          />
          <span v-if="link.text">{{ link.text }}</span>
        </v-btn>

        <div class="flex-1-0-100 text-center mt-2">
          {{ new Date().getFullYear() }} — <strong><a href="https://ics.hutton.ac.uk/">Information &amp; Computational Sciences</a> — <a href="https://www.hutton.ac.uk/">The James Hutton Institute</a></strong>
        </div>
      </v-footer>
    </v-main>

    <v-overlay
      v-model="loading"
      class="align-center justify-center"
      persistent
    >
      <div class="d-flex flex-column align-center justify-center">
        <v-progress-circular
          color="primary"
          indeterminate
          size="64"
        />
        <div>{{ loadingMessage }}</div>
      </div>
    </v-overlay>
  </v-app>
</template>

<script lang="ts" setup>
  // @ts-ignore
  import emitter from 'tiny-emitter/instance'
  import { useGoTo } from 'vuetify'

  type CallbackFunction = () => void
  interface Link {
    id: string
    text?: string
    to?: string
    href?: string
    icon?: string
    tooltip: string
    click?: CallbackFunction
  }

  const links = ref<Link[]>([
    { id: 'home', tooltip: 'Go home', text: 'Home', to: '/' },
    { id: 'github', tooltip: 'GitHub repository', icon: 'mdi-github', href: 'https://github.com/cropgeeks/spriggles' },
    { id: 'totop', tooltip: 'Return to top', icon: 'mdi-chevron-up', click: () => { goTo(0) } },
  ])

  const goTo = useGoTo()
  const loading = ref<boolean>(false)
  const loadingMessage = ref<string>()
  const route = useRoute()

  function setLoading (newLoading: boolean, newMessage: string) {
    loading.value = newLoading
    loadingMessage.value = newLoading ? newMessage : undefined
  }

  function addTab () {
    emitter.emit('add-tab')
  }
  function downloadData () {
    emitter.emit('download')
  }

  onMounted(() => {
    emitter.on('set-loading', setLoading)
  })
  onBeforeUnmount(() => {
    emitter.off('set-loading', setLoading)
  })
</script>

<style>
.app-content {
  height: 100%;
  flex-grow: 1;
}
</style>
