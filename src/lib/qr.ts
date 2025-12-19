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
