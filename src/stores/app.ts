// Utilities
import { type XY } from 'fabric'
import { defineStore } from 'pinia'

export const coreStore = defineStore('app', {
  state: () => ({
    hasGridScoreImage: false,
    latestImagePoints: undefined as (XY[] | undefined),
  }),
  actions: {
    setHasGridScoreImage (newHasGridScoreImage: boolean) {
      this.hasGridScoreImage = newHasGridScoreImage
    },
    setLatestImagePoints (newLatestImagePoints: XY[] | undefined) {
      this.latestImagePoints = newLatestImagePoints
    },
  },
})
