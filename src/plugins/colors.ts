interface Color {
  r: number
  g: number
  b: number
}

/**
 * Converts a HEX value into an RGB object
 * @param {String} hex The hex color
 */
const hexToRgb = (hex: string): Color | undefined => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : undefined
}

/**
 * Converts the given R, G, B values into a HEX color
 * @param {Number} r The red color component
 * @param {Number} g The green color component
 * @param {Number} b The blue color component
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

const createColorGradient = (one: string, two: string, steps: number) => {
  const oneRgb = hexToRgb(one)
  const twoRgb = hexToRgb(two)

  if (steps < 2 || !oneRgb || !twoRgb) {
    return [one]
  }

  const result = []
  for (let i = 0; i < steps; i++) {
    const iNorm = (i / (steps - 1))
    result.push(rgbToHex(
      Math.floor(oneRgb.r + iNorm * (twoRgb.r - oneRgb.r)),
      Math.floor(oneRgb.g + iNorm * (twoRgb.g - oneRgb.g)),
      Math.floor(oneRgb.b + iNorm * (twoRgb.b - oneRgb.b))
    ))
  }
  return result
}

const createMultiColorGradient = (colors: string[], steps: number): string[] => {
  if (colors.length > steps) {
    return colors.slice(0, steps)
  }

  const sections = colors.length - 1

  let result: string[] = []

  for (let i = 0; i < sections - 1; i++) {
    result = result.concat(createColorGradient(colors[i], colors[i + 1], Math.max(1, Math.floor(steps / sections))))
  }

  while (result.length < steps) {
    result.push(colors[colors.length - 1])
  }

  return result
}

export {
  createMultiColorGradient,
  createColorGradient,
}
