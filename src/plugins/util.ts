import type { Layout } from '@/types/gridscore'
import ShortUniqueId from 'short-unique-id'

export interface Dims {
  x: number
  y: number
}

export enum TruncationPosition {
  START,
  MIDDLE,
  END
}

const uid = new ShortUniqueId({
  dictionary: [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '-', '_',
  ],
  length: 16,
})

const getId = () => uid.randomUUID()

const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const DIVISIONS = [
  { amount: 60, name: 'seconds' },
  { amount: 60, name: 'minutes' },
  { amount: 24, name: 'hours' },
  { amount: 7, name: 'days' },
  { amount: 4.34524, name: 'weeks' },
  { amount: 12, name: 'months' },
  { amount: Number.POSITIVE_INFINITY, name: 'years' },
]

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

const toLocalDateString = (date: (string | undefined) = undefined) => {
  const d = date === undefined ? new Date() : new Date(date)
  const month = padZerosTo('' + (d.getMonth() + 1), 2)
  const day = padZerosTo('' + d.getDate(), 2)
  const year = d.getFullYear()

  return [year, month, day].join('-')
}

const padZerosTo = (str: string, length: number) => {
  while (str.length < length) {
    str = '0' + str
  }

  return str
}

const formatTimeAgo = (date: string) => {
  const formatter = new Intl.RelativeTimeFormat('en', {
    numeric: 'always',
  })

  let duration = (new Date(date).getTime() - new Date().getTime()) / 1000

  for (let i = 0; i <= DIVISIONS.length; i++) {
    const division = DIVISIONS[i]
    if (Math.abs(duration) < division.amount) {
      // @ts-ignore
      return formatter.format(Math.round(duration), division.name)
    }
    duration /= division.amount
  }
}

const getGridScoreRowIndex = (layout: Layout | undefined, row: number) => {
  if (!layout) {
    return -1
  }
  let index = -1
  if (layout.rowLabels && layout.rowLabels.length === layout.rows) {
    index = layout.rowLabels.indexOf(row)
  }

  if (index === -1) {
    index = layout.rowOrder === 'TOP_TO_BOTTOM' ? (row - 1) : (layout.rows - row)
  }

  return index
}

const getGridScoreColumnIndex = (layout: Layout | undefined, column: number) => {
  if (!layout) {
    return -1
  }
  let index = -1
  if (layout.columnLabels && layout.columnLabels.length === layout.columns) {
    index = layout.columnLabels.indexOf(column)
  }

  if (index === -1) {
    index = layout.columnOrder === 'LEFT_TO_RIGHT' ? (column - 1) : (layout.columns - column)
  }

  return index
}

export {
  minkowskiDistance,
  debounce,
  limitDimensions,
  truncate,
  getId,
  uuidv4,
  toLocalDateString,
  formatTimeAgo,
  getGridScoreRowIndex,
  getGridScoreColumnIndex,
}
