import React, { useState } from 'react'
import { elementsFromContent, generateGridSvg } from './lib/qr'

export default function App() {
  const [text, setText] = useState('Hallo Sebastian!')
  const [ecl, setEcl] = useState<'L' | 'M' | 'Q' | 'H'>('L')
  const [elements, setElements] = useState<string[]>([])

  // Grid states
  const [gridSvgFull, setGridSvgFull] = useState<string>('')
  const [gridSvgPreview, setGridSvgPreview] = useState<string>('')
  const [cellSize, setCellSize] = useState<number>(20)
  const [strokeColor, setStrokeColor] = useState<string>('#cbd5e1')
  const [labelFontSize, setLabelFontSize] = useState<number>(12)
  const [prefillPercent, setPrefillPercent] = useState<number>(0)

  function stripXmlProlog(s: string) {
    return s.replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, '')
  }

  function handleGenerateGridSvg() {
    try {
      const s = generateGridSvg(text, {
        ecl,
        cellSize,
        strokeColor,
        labelColor: '#111827',
        labelFontSize,
        padding: 8,
        prefillPercent,
      })
      setGridSvgFull(s)
      setGridSvgPreview(stripXmlProlog(s))
      // Generate the module list together with the grid so it appears under Grid/Malvorlage
      try {
        const elems = elementsFromContent(text, ecl, prefillPercent)
        setElements(elems)
      } catch (e) {
        console.error('Failed to compute module list for grid:', e)
      }
    } catch (err) {
      console.error(err)
      setGridSvgFull('')
      setGridSvgPreview('')
    }
  }

  function handleDownloadGridSvg() {
    if (!gridSvgFull) return
    const blob = new Blob([gridSvgFull], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr-grid.svg'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Rendert das erzeugte Grid-SVG in ein Canvas und lädt ein transparentes PNG herunter.
  async function handleDownloadGridPng() {
    if (!gridSvgFull) return
    try {
      // Create a Blob and URL for the SVG (more reliable than data: URL)
      const svgBlob = new Blob([gridSvgFull], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = svgUrl

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load SVG as image'))
      })

      // Determine size from image (naturalWidth/Height reflect SVG width/height)
      const width = img.naturalWidth || img.width
      const height = img.naturalHeight || img.height
      if (!width || !height) throw new Error('Invalid SVG dimensions')

      // HiDPI support
      const ratio = Math.max(1, window.devicePixelRatio || 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (ratio !== 1) ctx.scale(ratio, ratio)

      // draw image; SVG has transparent background already
      ctx.drawImage(img, 0, 0, width, height)

      // cleanup svg object URL
      URL.revokeObjectURL(svgUrl)

      // export to blob and trigger download
      canvas.toBlob((blob) => {
        if (!blob) return console.error('Failed to create PNG blob')
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'qr-grid.png'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (err) {
      console.error('PNG export failed', err)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold">QR Color by Numbers</h1>
          <p className="text-sm opacity-90">Erzeuge QR-Grids und exportiere die schwarzen Module als Zellenliste.</p>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Grid / Malvorlage</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium mb-2">Text / URL</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={4} className="w-full p-2 border rounded" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">Error Correction (ECL)</label>
                <select value={ecl} onChange={e => setEcl(e.target.value as 'L' | 'M' | 'Q' | 'H')} className="w-full p-2 border rounded">
                  <option value="L">L (7%)</option>
                  <option value="M">M (15%)</option>
                  <option value="Q">Q (25%)</option>
                  <option value="H">H (30%)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Cell size (px)</label>
                <input type="number" value={cellSize} onChange={e => setCellSize(Number(e.target.value))} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm">Stroke Color</label>
                <input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)} className="w-full h-10 p-1 border rounded" />
              </div>
              <div>
                <label className="block text-sm">Label font size</label>
                <input type="number" value={labelFontSize} onChange={e => setLabelFontSize(Number(e.target.value))} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm">Prefill (%)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={100} value={prefillPercent} onChange={e => setPrefillPercent(Number(e.target.value))} className="w-full" />
                  <input type="number" value={prefillPercent} onChange={e => setPrefillPercent(Number(e.target.value))} className="w-20 p-2 border rounded" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={handleGenerateGridSvg} className="bg-green-600 text-white px-3 py-2 rounded">Generiere Grid SVG</button>
              <button onClick={handleDownloadGridSvg} className="bg-gray-800 text-white px-3 py-2 rounded">Download Grid SVG</button>
              <button onClick={handleDownloadGridPng} className="bg-blue-600 text-white px-3 py-2 rounded">Download Grid PNG</button>
              <button onClick={() => { navigator.clipboard?.writeText(elements.join(' ')) }} className="bg-gray-200 px-3 py-2 rounded">Kopiere Modul-Liste</button>
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-4">Vorschau</h3>
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-full">
                  <h4 className="font-medium mb-2">Grid SVG</h4>
                  {gridSvgPreview ? (
                    <div className="overflow-auto border bg-white p-4" dangerouslySetInnerHTML={{ __html: gridSvgPreview }} />
                  ) : (
                    <div className="text-gray-400">Noch keine Grid-Vorschau. Klicke auf "Generiere Grid SVG".</div>
                  )}
                </div>
              </div>
            </div>

            {/* Modules: show modules list under Grid/Malvorlage (updated when grid is generated) */}
            <div className="mt-4">
              <h3 className="font-medium">Module ({elements.length})</h3>
              <div className="mt-2 text-sm text-gray-600">
                {elements.length === 0 ? <em>Keine Module generiert</em> : <pre className="whitespace-pre-wrap break-words">{elements.join(' ')}</pre>}
              </div>
            </div>

          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-gray-500">
        <div className="max-w-4xl mx-auto px-4">Made with ❤️ — deployed on GitHub Pages</div>
      </footer>
    </div>
  )
}
