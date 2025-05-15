export interface Dims {
  x: number
  y: number
}

export enum TruncationPosition {
  START,
  MIDDLE,
  END
}

const minkowskiDistance = (a: number[], b: number[], order: number = 2) => {
  const l = Math.min(a.length, b.length)

  let result = 0

  for (let i = 0; i < l; i++) {
    result += Math.pow(Math.abs(a[i] - b[i]), order)
  }

  return Math.pow(result, 1 / order)
}

const debounce = <T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number,
) => {
  let timeoutTimer: ReturnType<typeof setTimeout>;

  return (...args: T) => {
    clearTimeout(timeoutTimer)

    timeoutTimer = setTimeout(() => {
      callback(...args)
    }, delay)
  }
}

const limitDimensions = (width: number, height: number, maxRes: number): Dims => {
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

const truncate = (str: string, length: number, truncateWhere: TruncationPosition = TruncationPosition.START) => {
  const parts = str.split('')

  if (parts.length > length) {
    const maxLength = length - 3

    switch (truncateWhere) {
      case TruncationPosition.START:
        return `...${parts.slice(parts.length - maxLength, parts.length).join('')}`
      case TruncationPosition.MIDDLE:
        const middle = Math.floor(maxLength / 2)
        return `${parts.slice(0, middle).join('')}...${parts.slice(parts.length - middle, parts.length).join('')}`
      case TruncationPosition.END:
        return `${parts.slice(0, maxLength).join('')}...`
    }
  } else {
    return str
  }
}

export {
  minkowskiDistance,
  debounce,
  limitDimensions,
  truncate,
}
