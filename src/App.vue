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

        <v-app-bar-title style="cursor: pointer" @click="router.push('/')">Spriggles</v-app-bar-title>
        <v-spacer />
        <v-btn icon @click="addTab">
          <v-icon icon="mdi-plus" />
          <v-tooltip activator="parent" location="bottom">Add new image tab</v-tooltip>
        </v-btn>
        <v-btn v-if="store.hasGridScoreImage" icon @click="exportToGridScore">
          <v-icon>
            <svg
              class="b-icon bi"
              fill="currentColor"
              height="20"
              viewBox="0 0 24 24"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M13.548.048a6.254 6.254 0 0 0-2.42.969c-.35.24-1.017.855-1.217 1.122l-.094.13-.452-.22c-.87-.428-1.577-.589-2.586-.585-.742 0-1.189.071-1.805.275a5.864 5.864 0 0 0-3.39 2.998c-.876 1.856-.727 3.948.408 5.718.05.082.039.102-.267.412a5.699 5.699 0 0 0-1.652 3.638 5.71 5.71 0 0 0 .584 2.994c.793 1.59 2.17 2.664 3.944 3.076.428.099.542.11 1.217.11.722 0 1.047-.039 1.613-.196.07-.02.106.028.259.33a5.787 5.787 0 0 0 3.987 3.068c.49.106 1.397.146 1.871.083a5.826 5.826 0 0 0 3.952-2.296c.624-.836 1.052-1.974 1.119-2.978.015-.2.043-.353.066-.361.024-.008.22-.04.44-.071 2.048-.318 3.799-1.801 4.501-3.818 1.005-2.88-.447-6.087-3.277-7.24l-.29-.118.059-.263c.043-.189.059-.487.059-1.048 0-.663-.012-.844-.083-1.165-.4-1.786-1.522-3.242-3.092-4.011a5.447 5.447 0 0 0-1.354-.483c-.534-.121-1.558-.157-2.1-.07zm-1.667 10.917c.227.11.459.216.522.228.117.03.121.043.062.337a6.288 6.288 0 0 0-.066.565l-.028.353-.314.043a5.936 5.936 0 0 0-.56.11 2.784 2.784 0 0 1-.287.063c-.02 0-.114-.153-.208-.345a5.896 5.896 0 0 0-.295-.514l-.117-.173.42-.443c.231-.244.427-.44.439-.436.012.004.204.098.432.212z"/>
            </svg>
          </v-icon>
          <v-tooltip activator="parent" location="bottom">Export data to GridScore</v-tooltip>
        </v-btn>
        <v-btn icon @click="downloadData">
          <v-icon icon="mdi-file-excel-outline" />
          <v-tooltip activator="parent" location="bottom">Export data to Excel</v-tooltip>
        </v-btn>
        <v-btn icon to="/about">
          <v-icon icon="mdi-information-outline" />
          <v-tooltip activator="parent" location="bottom">Show information about Spriggles</v-tooltip>
        </v-btn>

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
  import { coreStore } from '@/stores/app'

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

  // COMPOSITION
  const store = coreStore()
  const goTo = useGoTo()
  const loading = ref<boolean>(false)
  const loadingMessage = ref<string>()
  const route = useRoute()
  const router = useRouter()

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
  function exportToGridScore () {
    emitter.emit('export-gridscore')
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
.rotate-90 {
  transform: rotate(90deg);
}
</style>
