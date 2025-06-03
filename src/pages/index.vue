<template>
  <Teleport to="#appbar .v-toolbar__extension">
    <v-tabs
      v-model="tab"
      center-active
    >
      <v-tab
        v-for="(image, index) in images"
        :key="`tab-${index}`"
        class="d-flex flex-column image-tab"
        :title="image.title"
      >
        {{ image.displayTitle }}
        <template #append>
          <v-progress-linear :color="gradient[Math.ceil((image.ratio || 0) * 100) - 1]" :model-value="(image.ratio || 0) * 100" />
        </template>
      </v-tab>
    </v-tabs>
  </Teleport>
  <v-tabs-window v-model="tab">
    <v-tabs-window-item
      v-for="(image, index) in images"
      :key="`tab-content-${image.id}`"
      :value="image"
    >
      <div class="mb-5 d-flex justify-space-between align-center">
        <v-btn
          prepend-icon="mdi-delete"
          text="Delete tab"
          @click="deleteImage(index)"
        />
        <v-chip
          v-if="image.gridscoreConfig"
          color="info"
          variant="tonal"
          @click="onSelectImage(image)"
        >
          <template #prepend>
            <v-icon>
              <svg
                class="b-icon bi me-2"
                fill="currentColor"
                height="20"
                viewBox="0 0 24 24"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M13.548.048a6.254 6.254 0 0 0-2.42.969c-.35.24-1.017.855-1.217 1.122l-.094.13-.452-.22c-.87-.428-1.577-.589-2.586-.585-.742 0-1.189.071-1.805.275a5.864 5.864 0 0 0-3.39 2.998c-.876 1.856-.727 3.948.408 5.718.05.082.039.102-.267.412a5.699 5.699 0 0 0-1.652 3.638 5.71 5.71 0 0 0 .584 2.994c.793 1.59 2.17 2.664 3.944 3.076.428.099.542.11 1.217.11.722 0 1.047-.039 1.613-.196.07-.02.106.028.259.33a5.787 5.787 0 0 0 3.987 3.068c.49.106 1.397.146 1.871.083a5.826 5.826 0 0 0 3.952-2.296c.624-.836 1.052-1.974 1.119-2.978.015-.2.043-.353.066-.361.024-.008.22-.04.44-.071 2.048-.318 3.799-1.801 4.501-3.818 1.005-2.88-.447-6.087-3.277-7.24l-.29-.118.059-.263c.043-.189.059-.487.059-1.048 0-.663-.012-.844-.083-1.165-.4-1.786-1.522-3.242-3.092-4.011a5.447 5.447 0 0 0-1.354-.483c-.534-.121-1.558-.157-2.1-.07zm-1.667 10.917c.227.11.459.216.522.228.117.03.121.043.062.337a6.288 6.288 0 0 0-.066.565l-.028.353-.314.043a5.936 5.936 0 0 0-.56.11 2.784 2.784 0 0 1-.287.063c-.02 0-.114-.153-.208-.345a5.896 5.896 0 0 0-.295-.514l-.117-.173.42-.443c.231-.244.427-.44.439-.436.012.004.204.098.432.212z"/>
              </svg>
            </v-icon>
          </template>
          GridScore image
        </v-chip>
      </div>
      <ImageProcessor
        :file-to-load="image.fileToLoad"
        :image-id="image.id"
        :neighbor-ids="[images[index - 1]?.id, images[index + 1]?.id]"
        @file-loaded="imageFileLoaded(index)"
        @ratio-changed="newRatio => updateRatio(index, newRatio)"
        @title-changed="newTitle => updateTitle(index, newTitle)"
      />
    </v-tabs-window-item>
  </v-tabs-window>

  <GridScoreInfoModal
    v-if="selectedImage && selectedImage.gridscoreConfig"
    ref="gridscoreInfoModal"
    title="GridScore configuration"
  >
    <v-list>
      <v-list-item prepend-icon="mdi-flower" :title="selectedImage.gridscoreConfig.germplasm" />
      <v-list-item prepend-icon="mdi-format-list-bulleted" :title="selectedImage.gridscoreConfig.rep" />
      <v-list-item prepend-icon="mdi-table-column" :title="selectedImage.gridscoreConfig.row" />
      <v-list-item :title="selectedImage.gridscoreConfig.column">
        <template #prepend>
          <v-icon class="rotate-90" icon="mdi-table-column" />
        </template>
      </v-list-item>
      <v-list-item prepend-icon="mdi-flower" :title="selectedImage.gridscoreConfig.timestamp" />
    </v-list>
  </GridScoreInfoModal>
  <GridScoreExportModal v-if="gridscoreImages" ref="gridscoreExportModal" :images="gridscoreImages" />
  <SettingsModal ref="settingsModal" />
</template>

<script lang="ts" setup>
  // @ts-ignore
  import emitter from 'tiny-emitter/instance'
  import * as XLSX from 'xlsx'
  import ImageProcessor from '@/components/ImageProcessor.vue'
  import GridScoreInfoModal from '@/components/modals/GridScoreInfoModal.vue'
  import { getId, truncate, TruncationPosition } from '@/plugins/util'
  import { createColorGradient } from '@/plugins/colors'
  import { useTheme } from 'vuetify'
  import { coreStore } from '@/stores/app'
  import GridScoreExportModal from '@/components/modals/GridScoreExportModal.vue'
  import SettingsModal from '@/components/modals/SettingsModal.vue'

  const vTheme = useTheme()

  const pattern = /(?<trialName>.+)_(?<date>\d{4}-\d{2}-\d{2})_(?<time>\d{2}-\d{2}-\d{2})_(?<germplasm>.+)_(?<row>\d+)_(?<column>\d+)_.+/

  // TYPES
  export interface GridScoreConfig {
    germplasm: string
    rep?: string | undefined
    row: number
    column: number
    timestamp?: string
  }
  export interface Tab {
    id: string
    title: string
    displayTitle: string
    gridscoreConfig?: GridScoreConfig
    ratio?: number | undefined
    fileToLoad?: File
  }

  // COMPOSITION
  const store = coreStore()

  // REFS
  const tab = ref<number>(0)
  const selectedImage = ref<Tab>()
  const gridscoreInfoModal = ref()
  const gridscoreExportModal = ref()
  const settingsModal = ref()
  const images = ref<Tab[]>([
    { id: getId(), title: 'Image', displayTitle: 'Image' },
  ])

  // COMPUTED
  const gradient: ComputedRef<string[]> = computed(() => {
    const maxRatio = Math.max(...images.value.map(i => i.ratio || 0))

    if (maxRatio > 0) {
      return createColorGradient(vTheme.current.value.colors.primary, vTheme.current.value.colors.secondary, Math.ceil(maxRatio * 100))
    } else {
      return [vTheme.current.value.colors.primary]
    }
  })
  const atLeastOneGridScoreImage: ComputedRef<boolean> = computed(() => {
    return gridscoreImages.value.length > 0
  })
  const gridscoreImages: ComputedRef<Tab[]> = computed(() => {
    if (images.value) {
      return images.value.filter(i => i.gridscoreConfig !== undefined && i.gridscoreConfig !== null)
    } else {
      return []
    }
  })

  // WATCH
  watch(atLeastOneGridScoreImage, async newValue => {
    store.setHasGridScoreImage(newValue)
  })

  // METHODS
  function imageFileLoaded (index: number) {
    images.value[index].fileToLoad = undefined
  }
  function onSelectImage (image: Tab) {
    selectedImage.value = image

    nextTick(() => gridscoreInfoModal.value.show())
  }
  function updateTitle (index: number, title: string) {
    const shortTitle = truncate(title, 20, TruncationPosition.MIDDLE)
    images.value[index].displayTitle = shortTitle
    images.value[index].title = title

    const groups = title.match(pattern)?.groups

    if (groups) {
      images.value[index].gridscoreConfig = {
        germplasm: groups.germplasm,
        row: +groups.row,
        column: +groups.column,
        timestamp: groups.date + ' ' + groups.time.replace(/-/g, ':'),
      }
    }
  }
  function updateRatio (index: number, ratio: number) {
    images.value[index].ratio = ratio
  }
  function addTab () {
    images.value.push({
      id: getId(),
      title: 'Image',
      displayTitle: 'Image',
    })

    tab.value = images.value.length - 1
  }
  function addImages (files: File[]) {
    files.forEach(f => {
      images.value.push({
        id: getId(),
        title: 'Image',
        displayTitle: 'Image',
        fileToLoad: f,
      })

      tab.value = images.value.length - 1
    })
  }
  function deleteImage (index: number) {
    images.value.splice(index, 1)
    tab.value = Math.max(0, Math.min(images.value.length - 1, index - 1))
  }
  function download () {
    const worksheet = XLSX.utils.json_to_sheet(images.value)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vegetation indices')
    XLSX.writeFile(workbook, `${new Date().toISOString().split('T')[0]}-spriggles.xlsx`)
  }
  function exportToGridScore () {
    gridscoreExportModal.value.show()
  }
  function showSettings () {
    settingsModal.value.show()
  }

  // LIFECYCLE
  onMounted(() => {
    emitter.on('add-tab', addTab)
    emitter.on('add-images', addImages)
    emitter.on('download', download)
    emitter.on('export-gridscore', exportToGridScore)
    emitter.on('show-settings', showSettings)
  })
  onBeforeUnmount(() => {
    emitter.off('add-tab', addTab)
    emitter.off('add-images', addImages)
    emitter.off('download', download)
    emitter.off('export-gridscore', exportToGridScore)
    emitter.off('show-settings', showSettings)
  })
</script>

<style>
.image-tab .v-btn__append {
  width: 100%;
  margin: 0;
  padding-top: 8px;
}
</style>
