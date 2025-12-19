import QRCode from 'qrcode-svg'

export function columnName(index: number, oneBased = false): string {
  let n = index + 1
  if (n <= 0) throw new RangeError('Index must be positive when oneBased=true or >=0 when oneBased=false')
  let result = ''
  while (n > 0) {
    n--
    const char = String.fromCharCode(65 + (n % 26))
    result = char + result
    n = Math.floor(n / 26)
  }
  return result
}

export function generateColumnNames(length: number, oneBased = false): string[] {
  if (!Number.isFinite(length) || length < 0) {
    throw new RangeError('length must be a non-negative finite number')
  }
  const names: string[] = []
  for (let i = 0; i < Math.floor(length); i++) {
    names.push(columnName(i, oneBased))
  }
  return names
}

// ecl: 'L' | 'M' | 'Q' | 'H'
export function generateQrSvg(content: string, ecl: string = 'L', size = 256, fill = '#000000', background = '#ffffff') {
  const qr = new QRCode({
    content,
    ecl,
    padding: 0,
    width: size,
    color: fill,
    background: background,
  })
  // @ts-ignore
  const svg = qr.svg() || ''
  return svg
}

export function elementsFromContent(content: string, ecl: string = 'L') {
  const qr = new QRCode({ content, ecl })
  // @ts-ignore
  const modules = qr.qrcode.modules
  const length = modules.length
  const columnNames = generateColumnNames(length)
  const elements: string[] = []
  for (let y = 0; y < length; y++) {
    for (let x = 0; x < length; x++) {
      const module = modules[x][y]
      if (module) elements.push(`${columnNames[x]}${y + 1}`)
    }
  }
  return elements
}

export function getModules(content: string, ecl: string = 'L') {
  const qr = new QRCode({ content, ecl })
  // @ts-ignore
  const modules: boolean[][] = qr.qrcode.modules
  const size = modules.length
  return { modules, size }
}

export function generateGridSvg(
  content: string,
  options?: {
    ecl?: string
    cellSize?: number
    showPattern?: boolean
    strokeColor?: string
    labelColor?: string
    labelFontSize?: number
    padding?: number
  }
) {
  const {
    ecl = 'L',
    cellSize = 20,
    showPattern = true,
    strokeColor = '#cbd5e1',
    labelColor = '#111827',
    labelFontSize = 12,
    padding = 8,
  } = options || {}

  const { modules, size } = getModules(content, ecl)
  const cols = size
  const rows = size

  // normalize modules to modulesByRow[r][c]
  const modulesByRow: boolean[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => !!(modules[c] && modules[c][r]))
  )

  const colNames = generateColumnNames(cols)

  const labelMarginX = Math.max(40, Math.ceil(labelFontSize * 2.5))
  const labelMarginY = Math.max(24, Math.ceil(labelFontSize * 1.8))

  const width = labelMarginX + cols * cellSize + padding
  const height = labelMarginY + rows * cellSize + padding

  const parts: string[] = []
  parts.push('<?xml version="1.0" encoding="UTF-8"?>')
  parts.push(`\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">`)
  parts.push(`<rect width="${width}" height="${height}" fill="transparent"/>`)

  // column labels
  for (let c = 0; c < cols; c++) {
    const x = labelMarginX + c * cellSize + cellSize / 2
    const y = Math.ceil(labelFontSize / 2)
    parts.push(
      `<text x="${x}" y="${y}" font-family="sans-serif" font-size="${labelFontSize}" fill="${labelColor}" text-anchor="middle" dominant-baseline="hanging">${colNames[c]}</text>`
    )
  }

  // row labels
  for (let r = 0; r < rows; r++) {
    const x = Math.round(labelMarginX - 6)
    const y = labelMarginY + r * cellSize + cellSize / 2
    parts.push(
      `<text x="${x}" y="${y}" font-family="sans-serif" font-size="${labelFontSize}" fill="${labelColor}" text-anchor="end" dominant-baseline="middle">${r + 1}</text>`
    )
  }

  // grid cells (outlines)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = labelMarginX + c * cellSize
      const y = labelMarginY + r * cellSize
      parts.push(`<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="transparent" stroke="${strokeColor}" stroke-width="1" />`)
    }
  }

  // pattern overlay
  if (showPattern) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (modulesByRow[r][c]) {
          const x = labelMarginX + c * cellSize
          const y = labelMarginY + r * cellSize
          // tag the overlay rect so it can be removed safely later
          parts.push(`<rect class="overlay-module" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#000" fill-opacity="0.18" stroke="none"/>`)
        }
      }
    }
  }

  parts.push('</svg>')
  return parts.join('\n')
}
