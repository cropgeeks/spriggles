<template>
  <v-app>
    <v-main class="pt-7">
      <v-app-bar
        :elevation="2"
        extended
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

        <template #extension>
          <div id="tabs" />
        </template>
      </v-app-bar>

      <v-container class="app-content">
        <router-view />
      </v-container>
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

  const loading = ref<boolean>(false)
  const loadingMessage = ref<string>()

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
