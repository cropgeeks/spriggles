<template>
  <Teleport to="#tabs">
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
          <v-progress-linear color="primary" :model-value="(image.ratio || 0) * 100" />
        </template>
      </v-tab>
    </v-tabs>
  </Teleport>
  <v-tabs-window v-model="tab">
    <v-tabs-window-item
      v-for="(image, index) in images"
      :key="`tab-content-${index}`"
      :value="image"
    >
      <ImageProcessor
        @delete="deleteImage(index)"
        @ratio-changed="newRatio => updateRatio(index, newRatio)"
        @title-changed="newTitle => updateTitle(index, newTitle)"
      />
    </v-tabs-window-item>
  </v-tabs-window>
</template>

<script lang="ts" setup>
  // @ts-ignore
  import emitter from 'tiny-emitter/instance'
  import * as XLSX from 'xlsx'
  import ImageProcessor from '@/components/ImageProcessor.vue'
  import { truncate, TruncationPosition } from '@/plugins/util'

  const pattern = /(?<trialName>.+)_(?<date>\d{4}-\d{2}-\d{2})_(?<time>\d{2}-\d{2}-\d{2})_(?<germplasm>.+)_(?<row>\d+)_(?<column>\d+)_.+/

  interface GridScoreConfig {
    germplasm: string
    rep?: string | undefined
    row: number
    column: number
    timestamp?: string
  }

  interface Tab {
    title: string
    displayTitle: string
    gridscoreConfig?: GridScoreConfig
    ratio?: number | undefined
  }

  const tab = ref<number>(0)
  const images = ref<Tab[]>([
    { title: 'Image', displayTitle: 'Image' },
  ])

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
      title: 'Image',
      displayTitle: 'Image',
    })

    tab.value = images.value.length - 1
  }
  function deleteImage (index: number) {
    images.value.splice(index, 1)
  }
  function download () {
    const worksheet = XLSX.utils.json_to_sheet(images.value)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vegetation indices')
    XLSX.writeFile(workbook, `${new Date().toISOString().split('T')[0]}-spriggles.xlsx`)
  }

  onMounted(() => {
    emitter.on('add-tab', addTab)
    emitter.on('download', download)
  })
  onBeforeUnmount(() => {
    emitter.off('add-tab', addTab)
    emitter.on('download', download)
  })
</script>

<style>
.image-tab .v-btn__append {
  width: 100%;
  margin: 0;
  padding-top: 8px;
}
</style>
