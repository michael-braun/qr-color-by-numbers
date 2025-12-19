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

export function elementsFromContent(content: string, ecl: string = 'L', prefillPercent: number = 0) {
  const qr = new QRCode({ content, ecl })
  // @ts-ignore
  const modules = qr.qrcode.modules
  const length = modules.length

  // normalize modules into modulesByRow[r][c]
  const modulesByRow: boolean[][] = Array.from({ length }, (_, r) =>
    Array.from({ length }, (_, c) => !!(modules[c] && modules[c][r]))
  )

  const columnNames = generateColumnNames(length)

  // If prefillPercent>0, compute deterministic chosen black indices using helper
  const chosenSet = computePrefillIndices(modulesByRow, content, ecl, prefillPercent)

  const elements: string[] = []
  for (let r = 0; r < length; r++) {
    for (let c = 0; c < length; c++) {
      const module = modulesByRow[r][c]
      const idx = r * length + c
      if (module) {
        // skip if this black cell was selected as prefill
        if (chosenSet.has(idx)) continue
        elements.push(`${columnNames[c]}${r + 1}`)
      }
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
    prefillPercent?: number // 0..100
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
    prefillPercent = 0,
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

  // Render prefilled black cells (visible) based on deterministic selection
  const prefillChosen = computePrefillIndices(modulesByRow, content, ecl, prefillPercent)
  if (prefillChosen.size > 0) {
    for (const idx of prefillChosen) {
      const r = Math.floor(idx / cols)
      const c = idx % cols
      const x = labelMarginX + c * cellSize
      const y = labelMarginY + r * cellSize
      parts.push(`<rect class="prefill-cell" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#000" stroke="none"/>`)
    }
  }

  // NOTE: Overlay rendering (visual overlay of QR modules or prefilled cells)
  // has been removed; this function now only renders the labeled grid (cells and labels).
  // Prefill remains a logical concept (used by elementsFromContent) but is not drawn here.

  parts.push('</svg>')
  return parts.join('\n')
}

// Compute deterministic prefill indices (flattened indices r*cols + c) from modulesByRow.
export function computePrefillIndices(
  modulesByRow: boolean[][],
  content: string,
  ecl: string,
  prefillPercent: number
): Set<number> {
  const p = Math.max(0, Math.min(100, Number(prefillPercent) || 0))
  const chosen = new Set<number>()
  if (p <= 0) return chosen

  const rows = modulesByRow.length
  const cols = rows > 0 ? modulesByRow[0].length : 0

  // collect black indices
  const blackIndices: number[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (modulesByRow[r][c]) blackIndices.push(r * cols + c)
    }
  }

  if (blackIndices.length === 0) return chosen

  const blackTotal = blackIndices.length
  const count = Math.round((blackTotal * p) / 100)
  if (count <= 0) return chosen

  function hashStringToSeed(s: string) {
    let h = 2166136261 >>> 0
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 16777619) >>> 0
    }
    return h >>> 0
  }

  const seed = hashStringToSeed(content + '|' + ecl + '|' + String(p))
  let state = seed >>> 0
  function rnd() {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x100000000
  }

  // shuffle blackIndices with PRNG
  for (let i = blackIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const tmp = blackIndices[i]
    blackIndices[i] = blackIndices[j]
    blackIndices[j] = tmp
  }

  const take = Math.min(count, blackIndices.length)
  for (let k = 0; k < take; k++) chosen.add(blackIndices[k])
  return chosen
}
