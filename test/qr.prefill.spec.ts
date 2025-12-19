import { describe, it, expect } from 'vitest'
import { getModules, computePrefillIndices, elementsFromContent, generateGridSvg } from '../src/lib/qr'

describe('prefill selection consistency', () => {
  const content = 'Test Präfill'
  const ecl = 'L'
  const p = 30 // percent

  it('computePrefillIndices returns subset of black module indices', () => {
    const { modules, size } = getModules(content, ecl)
    // normalize modulesByRow
    const modulesByRow: boolean[][] = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => !!(modules[c] && modules[c][r]))
    )

    const blackIndices: number[] = []
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (modulesByRow[r][c]) blackIndices.push(r * size + c)
      }
    }

    const chosen = computePrefillIndices(modulesByRow, content, ecl, p)

    // all chosen must be in blackIndices
    for (const idx of chosen) {
      expect(blackIndices).toContain(idx)
    }
  })

  it('elementsFromContent excludes prefilled black modules', () => {
    const elementsNoPrefill = elementsFromContent(content, ecl, 0)
    const elementsWithPrefill = elementsFromContent(content, ecl, p)

    // elementsWithPrefill length should be <= elementsNoPrefill length
    expect(elementsWithPrefill.length).toBeLessThanOrEqual(elementsNoPrefill.length)

    // compute expected removed count by comparing sets
    const setNo = new Set(elementsNoPrefill)
    const setWith = new Set(elementsWithPrefill)

    // Every element in withPrefill should be in noPrefill
    for (const el of setWith) expect(setNo.has(el)).toBe(true)

    // The removed elements correspond to chosen indices -> check by generating grid svg
    const gridSvg = generateGridSvg(content, { ecl, cellSize: 10, showPattern: true, prefillPercent: p })

    // find overlay-prefill rects in svg (class="overlay-prefill") and compute their coordinates
    const rectRegex = /<rect[^>]*class="[^"]*overlay-prefill[^"]*"[^>]*x="(\d+)"[^>]*y="(\d+)"[^>]*width="(\d+)"/g
    const foundPrefill: Array<{x:number,y:number,w:number}> = []
    let m: RegExpExecArray | null
    while ((m = rectRegex.exec(gridSvg)) !== null) {
      foundPrefill.push({ x: Number(m[1]), y: Number(m[2]), w: Number(m[3]) })
    }

    // Map prefill rect positions back to module names (by using labelMargin and cellSize matching generateGridSvg)
    // We assume generateGridSvg uses the same labelMarginX/Y calculation; replicate here (labelFontSize default 12)
    const labelFontSize = 12
    const labelMarginX = Math.max(40, Math.ceil(labelFontSize * 2.5))
    const labelMarginY = Math.max(24, Math.ceil(labelFontSize * 1.8))
    const cellSize = 10

    const colNames = (n:number)=>{
      const names: string[] = []
      for (let i=0;i<n;i++){
        let idx=i+1; let res=''
        while(idx>0){ idx--; res = String.fromCharCode(65 + (idx%26)) + res; idx = Math.floor(idx/26)}
        names.push(res)
      }
      return names
    }

    // get total size from gridSvg by reading width/height attributes
    const sizeMatch = gridSvg.match(/viewBox="0 0 (\d+) (\d+)"/)
    expect(sizeMatch).not.toBeNull()

    const foundNames: string[] = []
    if (foundPrefill.length>0) {
      // compute cols and rows from earlier getModules
      const { modules: modules2, size: s2 } = getModules(content, ecl)
      const cols = s2
      const rows = s2
      const colNameArr = colNames(cols)

      for (const rect of foundPrefill) {
        const c = Math.round((rect.x - labelMarginX) / cellSize)
        const r = Math.round((rect.y - labelMarginY) / cellSize)
        if (c>=0 && c<cols && r>=0 && r<rows) {
          foundNames.push(`${colNameArr[c]}${r+1}`)
        }
      }
    }

    // Now removed = elementsNoPrefill - elementsWithPrefill should match foundNames (as sets, subset relation)
    const removed = elementsNoPrefill.filter(x => !setWith.has(x))

    // All foundNames should be in removed
    for (const name of foundNames) {
      expect(removed).toContain(name)
    }
  })
})

