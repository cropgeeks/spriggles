// Utilities
import { type XY } from 'fabric'
import { defineStore } from 'pinia'

export interface PolygonOptions {
  fill?: string
  corners?: string
  opacity?: number
  stroke?: string
}

export const coreStore = defineStore('app', {
  state: () => ({
    hasGridScoreImage: false,
    latestImagePoints: undefined as (XY[] | undefined),
    polygonOptions: { fill: '#ffffff', opacity: 0.25, stroke: '#ffffff', corners: '#6E1E41' } as PolygonOptions,
  }),
  actions: {
    setHasGridScoreImage (newHasGridScoreImage: boolean) {
      this.hasGridScoreImage = newHasGridScoreImage
    },
    setLatestImagePoints (newLatestImagePoints: XY[] | undefined) {
      this.latestImagePoints = newLatestImagePoints
    },
    setPolygonOptions (newPolygonOptions: PolygonOptions) {
      this.polygonOptions = Object.assign(this.polygonOptions, newPolygonOptions)
    },
  },
  persist: {
    key: 'spriggles',
  },
})
