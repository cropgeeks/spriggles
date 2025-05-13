<template>
  <div ref="wrapper">
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
      <canvas ref="openCvCanvas" class="d-none" />
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

    <img ref="unskewedImage" class="d-none" :src="unskewedImageSrc">

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
  import { ImgComparisonSlider } from '@img-comparison-slider/vue'
  import { Canvas, controlsUtils, Polygon, type TPointerEvent, type Transform } from 'fabric'
  import cv from '@techstark/opencv-js'

  const wrapper = useTemplateRef('wrapper')
  const polygonCanvas = useTemplateRef('polygonCanvas')
  const openCvCanvas = useTemplateRef('openCvCanvas')
  const scaledImage = useTemplateRef('scaledImage')
  const unskewedImage = useTemplateRef('unskewedImage')
  const sourceImageFile = ref<File>()
  const scaledImageSrc = ref<string>()
  const unskewedImageSrc = ref<string>()
  const vegetationImageSrc = ref<string>()
  const ratio = ref<number>()
  const sliderValue = ref<number>(50)

  const p1 = 0.95
  const p2 = 0.95
  const p3 = 20
  let maxRes = 1080
  let maxWidth = 1080
  let canvas: Canvas | undefined = undefined
  let polygon: Polygon | undefined = undefined
  let imageDimensions: Dims = { x: 0, y: 0 }
  let canvasDimensions: Dims = { x: 0, y: 0 }

  interface Dims {
    x: number
    y: number
  }

  watch(sourceImageFile, async (newValue: File | undefined) => {
    if (newValue) {
      ratio.value = undefined
      sliderValue.value = 50
      unskewedImageSrc.value = undefined
      vegetationImageSrc.value = undefined
      const reader = new FileReader()
      reader.onload = (e: any) => {
        scaledImageSrc.value = e.target.result

        nextTick(() => downScaleImage())
      }
      reader.readAsDataURL(newValue)
    } else {
      scaledImageSrc.value = undefined
    }
  })

  function maximizePolygon () {
    if (polygon) {
      polygon.points = [{ x: 0, y: 0 }, { x: canvasDimensions.x, y: 0 }, { x: canvasDimensions.x, y: canvasDimensions.y }, { x: 0, y: canvasDimensions.y }]
      polygon.setCoords()
      polygon.canvas?.renderAll()
    }
  }

  function addPolygon () {
    if (polygonCanvas.value) {
      if (!canvas) {
        canvas = new Canvas(polygonCanvas.value)
        const width = Math.min(maxWidth, imageDimensions.x)
        const height = width * (imageDimensions.y / imageDimensions.x)
        canvasDimensions = { x: width, y: height }
        canvas.setDimensions({ width, height })
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
      }

      if (!polygon) {
        polygon = new Polygon([{ x: 20, y: 20 }, { x: canvasDimensions.x - 40, y: 20 }, { x: canvasDimensions.x - 40, y: canvasDimensions.y - 40 }, { x: 20, y: canvasDimensions.y - 40 }], {
          fill: 'white',
          opacity: 0.25,
          strokeWidth: 1,
          stroke: 'white',
          objectCaching: false,
          transparentCorners: false,
          cornerColor: '#6E1E41',
          hasBorders: false,
        })
        canvas.add(polygon)
        polygon.controls = controlsUtils.createPolyControls(polygon)
        Object.keys(polygon.controls).forEach(k => {
          if (polygon) {
            const control = polygon.controls[k]
            const ph = control.actionHandler
            control.actionHandler = (a: TPointerEvent, b: Transform, x: number, y: number) => {
              const canvas = b.target.canvas
              if (x < 0 || y < 0 || x > (canvas?.width || 0) || y > (canvas?.height || 0)) {
                return false
              } else {
                return ph(a, b, x, y)
              }
            }
          }
        })
        canvas.setActiveObject(polygon)
      }
    }
  }

  function getDims (width: number, height: number, maxRes: number): Dims {
    if (width > maxRes || height > maxRes) {
      const vRatio = maxRes / height
      const hRatio = maxRes / width
      let targetWidth
      let targetHeight

      if (vRatio > hRatio) {
        targetWidth = maxRes
        targetHeight = height * hRatio
      } else {
        targetWidth = width * vRatio
        targetHeight = maxRes
      }

      return {
        x: targetWidth,
        y: targetHeight,
      }
    }

    return {
      x: width,
      y: height,
    }
  }

  function deleteResources (res: any) {
    res.forEach((r: any) => r.delete)
  }

  async function extractVegetation () {
    const points = polygon?.points || []

    if (scaledImage.value && openCvCanvas.value) {
      const src = cv.imread(scaledImage.value)
      const dst = new cv.Mat()
      const dsize = new cv.Size(src.cols, src.rows)
      const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y])
      const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, src.cols, 0, src.cols, src.rows, 0, src.rows])
      const M = cv.getPerspectiveTransform(srcTri, dstTri)
      cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar())
      cv.imshow(openCvCanvas.value, dst)

      unskewedImageSrc.value = openCvCanvas.value.toDataURL()

      deleteResources([src, dst, srcTri, dstTri, M])

      nextTick(() => calculateVegetationIndex())
    }
  }

  async function downScaleImage () {
    if (scaledImageSrc.value && scaledImage.value && openCvCanvas.value) {
      const src = cv.imread(scaledImage.value)
      const dst = new cv.Mat()
      let dsize

      if (src.cols > maxRes || src.rows > maxRes) {
        imageDimensions = getDims(src.cols, src.rows, maxRes)
        dsize = new cv.Size(imageDimensions.x, imageDimensions.y)

        // You can try more different parameters
        cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA)
        cv.imshow(openCvCanvas.value, dst)
        scaledImageSrc.value = openCvCanvas.value.toDataURL()
      } else {
        cv.imshow(openCvCanvas.value, src)
        scaledImageSrc.value = openCvCanvas.value.toDataURL()
      }

      addPolygon()

      deleteResources([src, dst])
    }
  }

  async function calculateVegetationIndex () {
    if (unskewedImageSrc.value && unskewedImage.value && openCvCanvas.value) {
      const unskewed = cv.imread(unskewedImage.value)
      const original = cv.imread(unskewedImage.value)
      const channels = unskewed.channels()

      // First, calculate the mask
      for (let row = 0; row < unskewed.rows; row++) {
        for (let col = 0; col < unskewed.cols; col++) {
          const x = row * unskewed.cols * channels + col * channels
          const r = unskewed.data[x]
          const g = unskewed.data[x + 1]
          const b = unskewed.data[x + 2]

          const v = ((r / g < p1) && (b / g < p2) && (2 * g - r - b) > p3) ? 255 : 0

          unskewed.data[x] = v
          unskewed.data[x + 1] = v
          unskewed.data[x + 2] = v
        }
      }

      // Then remove smaller clusters using opening
      const mask = new cv.Mat()
      const M = cv.Mat.ones(3, 3, cv.CV_8U)
      const anchor = new cv.Point(-1, -1)
      cv.morphologyEx(unskewed, mask, cv.MORPH_OPEN, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue())

      // Then calculate the ratio as well as setting the original non-green parts to black
      let count = 0
      let total = 0
      for (let row = 0; row < mask.rows; row++) {
        for (let col = 0; col < mask.cols; col++) {
          total++
          const x = row * mask.cols * channels + col * channels
          const r = mask.data[x]
          const g = mask.data[x + 1]
          const b = mask.data[x + 2]

          if (r > 0 || g > 0 || b > 0) {
            count++
          }
        }
      }

      ratio.value = count / total

      const extract = new cv.Mat()
      cv.bitwise_and(original, mask, extract)
      cv.imshow(openCvCanvas.value, extract)
      vegetationImageSrc.value = openCvCanvas.value.toDataURL()

      deleteResources([unskewed, original, mask, M, extract])
    }
  }

  onMounted(() => {
    maxWidth = wrapper.value?.clientWidth || 1080
    maxRes = 1080
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
