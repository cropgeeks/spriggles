<template>
  <div ref="wrapper">
    <v-btn
      class="mb-5"
      prepend-icon="mdi-delete"
      text="Delete tab"
      @click="emit('delete')"
    />

    <v-file-input
      v-model="sourceImageFile"
      accept="image/*"
      label="File input"
    />

    <v-btn
      v-if="polygon"
      prepend-icon="mdi-overscan"
      @click="maximizePolygon"
    >
      Maximize selection
    </v-btn>
    <div class="outer-canvas-container">
      <img ref="scaledImage" class="spriggles-img" :src="scaledImageSrc">
      <canvas ref="polygonCanvas" height="0" width="0" />
    </div>

    <v-btn
      v-if="polygon"
      class="my-4"
      prepend-icon="mdi-chevron-triple-down"
      @click="extractVegetation"
    >
      Extract vegetation
    </v-btn>

    <h2 v-if="ratio !== undefined">Vegetation ratio: {{ (ratio * 100).toFixed(2) }}%</h2>

    <ImgComparisonSlider :value="sliderValue">
      <figure slot="first" class="before">
        <img class="spriggles-img" :src="unskewedImageSrc">
        <figcaption>Original</figcaption>
      </figure>
      <figure slot="second" class="after">
        <img class="spriggles-img" :src="vegetationImageSrc">
        <figcaption>Extracted</figcaption>
      </figure>
    </ImgComparisonSlider>
  </div>
</template>

<script lang="ts" setup>
  // @ts-ignore
  import emitter from 'tiny-emitter/instance'
  import { ImgComparisonSlider } from '@img-comparison-slider/vue'
  import { Canvas, controlsUtils, Polygon, type TPointerEvent, type Transform } from 'fabric'
  import Image from 'image-js'
  import { distort, Canvas as LensCanvas, VirtualPixelMethod } from '@alxcube/lens'
  import downscale from 'downscale'
  import { type Dims, limitDimensions, minkowskiDistance } from '@/plugins/util'

  const emit = defineEmits(['delete', 'ratio-changed', 'title-changed'])

  const wrapper = useTemplateRef('wrapper')
  const polygonCanvas = useTemplateRef('polygonCanvas')
  const scaledImage = useTemplateRef('scaledImage')
  const sourceImageFile = ref<File>()
  const scaledImageSrc = ref<string>()
  const unskewedImageSrc = ref<string>()
  const vegetationImageSrc = ref<string>()
  const ratio = ref<number>()
  const sliderValue = ref<number>(50)
  const polygon = ref<Polygon>()

  const p1 = 0.95
  const p2 = 0.95
  const p3 = 20
  let maxRes = 1080
  let maxWidth = 1080
  let canvas: Canvas | undefined = undefined
  let imageDimensions: Dims = { x: 0, y: 0 }
  let canvasDimensions: Dims = { x: 0, y: 0 }
  const resizeObserver: ResizeObserver = new ResizeObserver(debounceResize)
  let lastKnownWidth: number = 0
  let timeout: ReturnType<typeof setTimeout>

  function debounceResize () {
    if (sourceImageFile.value && wrapper.value?.clientWidth && lastKnownWidth !== wrapper.value?.clientWidth) {
      lastKnownWidth = wrapper.value?.clientWidth

      canvas?.dispose()
      canvas = undefined
      polygon.value = undefined
      maxWidth = wrapper.value?.clientWidth || 1080
      if (polygonCanvas.value) {
        polygonCanvas.value.width = 0
        polygonCanvas.value.height = 0
      }

      clearTimeout(timeout)
      timeout = setTimeout(() => addPolygon(), 100)
    }
  }

  watch(sourceImageFile, async (newValue: File | undefined) => {
    if (newValue) {
      emitter.emit('set-loading', true, 'Loading image file')
      lastKnownWidth = 0
      canvas?.dispose()
      canvas = undefined
      polygon.value = undefined
      ratio.value = undefined
      sliderValue.value = 50
      unskewedImageSrc.value = undefined
      vegetationImageSrc.value = undefined
      emit('title-changed', newValue.name)
      const reader = new FileReader()
      reader.onload = (e: any) => {
        scaledImageSrc.value = e.target.result
        emitter.emit('set-loading', false)

        nextTick(() => downScaleImage())
      }
      reader.readAsDataURL(newValue)
    } else {
      scaledImageSrc.value = undefined
    }
  })

  function maximizePolygon () {
    if (polygon.value) {
      polygon.value.points = [{ x: 0, y: 0 }, { x: canvasDimensions.x, y: 0 }, { x: canvasDimensions.x, y: canvasDimensions.y }, { x: 0, y: canvasDimensions.y }]
      polygon.value.setCoords()
      polygon.value.canvas?.renderAll()
    }
  }

  function addPolygon () {
    if (polygonCanvas.value && scaledImage.value) {
      if (!canvas) {
        canvasDimensions = limitDimensions(scaledImage.value.clientWidth, scaledImage.value.clientHeight, maxRes)
        canvas = new Canvas(polygonCanvas.value)
        const width = Math.min(maxWidth, canvasDimensions.x)
        const height = width * (canvasDimensions.y / canvasDimensions.x)

        canvasDimensions = { x: width, y: height }
        canvas.setDimensions({ width, height })
        canvas.on('mouse:down', (e: any) => {
          if (polygon.value && polygon.value.points) {
            let index = -1
            let minDistance = Number.MAX_VALUE

            polygon.value.points.forEach((p, i) => {
              const distance = minkowskiDistance([p.x, p.y], [e.absolutePointer.x, e.absolutePointer.y])

              if (distance < minDistance) {
                minDistance = distance
                index = i
              }
            })

            if (index !== -1) {
              polygon.value.points[index].x = e.absolutePointer.x
              polygon.value.points[index].y = e.absolutePointer.y
              polygon.value.setCoords()
              polygon.value.canvas?.renderAll()
            }
          }
        })
        canvas.on('object:moving', (e: any) => {
          const obj = e.target
          // if object is too big ignore
          if(obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width){
            return
          }
          obj.setCoords()
          // top-left  corner
          if(obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0){
            obj.top = Math.max(obj.top, obj.top - obj.getBoundingRect().top)
            obj.left = Math.max(obj.left, obj.left - obj.getBoundingRect().left)
          }
          // bot-right corner
          if(obj.getBoundingRect().top + obj.getBoundingRect().height > obj.canvas.height || obj.getBoundingRect().left + obj.getBoundingRect().width > obj.canvas.width) {
            obj.top = Math.min(obj.top, obj.canvas.height - obj.getBoundingRect().height + obj.top - obj.getBoundingRect().top)
            obj.left = Math.min(obj.left, obj.canvas.width - obj.getBoundingRect().width + obj.left - obj.getBoundingRect().left)
          }
        })
      } else {
        // TODO: Check if dimensions same, if not resize canvas, move polygon
      }

      if (!polygon.value) {
        polygon.value = new Polygon([{ x: 0, y: 0 }, { x: canvasDimensions.x, y: 0 }, { x: canvasDimensions.x, y: canvasDimensions.y }, { x: 0, y: canvasDimensions.y }], {
          fill: 'white',
          opacity: 0.25,
          strokeWidth: 1,
          stroke: 'white',
          objectCaching: false,
          transparentCorners: false,
          cornerSize: 20,
          cornerColor: '#6E1E41',
          hasBorders: false,
        })
        canvas.add(polygon.value)
        polygon.value.controls = controlsUtils.createPolyControls(polygon.value)
        Object.keys(polygon.value.controls).forEach(k => {
          if (polygon.value) {
            const control = polygon.value.controls[k]
            const ph = control.actionHandler
            control.actionHandler = (a: TPointerEvent, b: Transform, x: number, y: number) => {
              const canvas = b.target.canvas
              return ph(a, b, Math.min(Math.max(x, 0), canvas?.width || 0), Math.min(Math.max(y, 0), canvas?.height || 0))
            }
          }
        })
        canvas.setActiveObject(polygon.value)
      }
    }
  }

  async function extractVegetation () {
    const ratio = imageDimensions.x / canvasDimensions.x
    const points = (polygon.value?.points || []).concat().map(p => {
      return {
        x: p.x * ratio,
        y: p.y * ratio,
      }
    })

    if (scaledImageSrc.value) {
      // We're doing img-src => blob => canvas => perspective transformed canvas => blob => img-src
      fetch(scaledImageSrc.value)
        .then(res => res.blob())
        .then(blob => {
          return LensCanvas.createFromBlob(blob)
        })
        .then(canvas => {
          return distort(canvas, 'Perspective', [points[0].x, points[0].y, 0, 0, points[1].x, points[1].y, canvas.width, 0, points[3].x, points[3].y, 0, canvas.height, points[2].x, points[2].y, canvas.width, canvas.height], {
            viewport: { width: canvas.width, height: canvas.height, x: 0, y: 0 },
            virtualPixelMethod: VirtualPixelMethod.TRANSPARENT,
          })
        })
        .then(img => {
          return (img.image.getResource() as OffscreenCanvas).convertToBlob()
        })
        .then(blob => {
          return new Promise(resolve => {
            const reader = new FileReader()
            reader.onload = () => {
              resolve(reader.result)
            }
            reader.readAsDataURL(blob)
          })
        })
        .then(imgData => {
          if (imgData) {
            unskewedImageSrc.value = (imgData as string)
            nextTick(() => calculateVegetationIndex())
          }
        })
    }
  }

  async function downScaleImage () {
    if (scaledImageSrc.value && scaledImage.value && sourceImageFile.value) {
      emitter.emit('set-loading', true, 'Scaling image file')
      const width = scaledImage.value.naturalWidth
      const height = scaledImage.value.naturalHeight

      if (width > maxRes || height > maxRes) {
        imageDimensions = limitDimensions(width, height, maxRes)
        scaledImageSrc.value = await downscale(sourceImageFile.value, imageDimensions.x, imageDimensions.y)
        emitter.emit('set-loading', false)
        nextTick(() => addPolygon())
      }
    }
  }

  async function calculateVegetationIndex () {
    if (unskewedImageSrc.value) {
      emitter.emit('set-loading', true, 'Calculating vegetation index')

      const image = await Image.load(unskewedImageSrc.value)
      const canopeo = image.grey({
        algorithm: (r,g,b) => {
          return ((r / g < p1) && (b / g < p2) && (2 * g - r - b) > p3) ? 255 : 0
        },
      })
      const mask = canopeo.open().close().mask()
      ratio.value = canopeo.data.filter(c => c !== 0).length / canopeo.data.length
      emit('ratio-changed', ratio.value)

      vegetationImageSrc.value = image.extract(mask).toDataURL()
      emitter.emit('set-loading', false)
    }
  }

  onMounted(() => {
    if (wrapper.value) {
      resizeObserver.observe(wrapper.value)
    }
    maxWidth = wrapper.value?.clientWidth || 1080
    maxRes = 1080
  })
  onBeforeUnmount(() => {
    if (wrapper.value) {
      resizeObserver.unobserve(wrapper.value)
    }
  })
</script>

<style>
.outer-canvas-container {
  display: grid;
}
.outer-canvas-container canvas.original,
.outer-canvas-container img,
.outer-canvas-container .canvas-container {
  grid-column: 1;
  grid-row: 1;
}
.spriggles-img {
  max-width: 100%;
  background-color: black;
}
.before,
.after {
  margin: 0;
}

.before figcaption,
.after figcaption {
  background: #fff;
  border: 1px solid #c0c0c0;
  border-radius: 12px;
  color: #2e3452;
  opacity: 0.8;
  padding: 12px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  line-height: 100%;
}

.before figcaption {
  left: 12px;
}

.after figcaption {
  right: 12px;
}
</style>
