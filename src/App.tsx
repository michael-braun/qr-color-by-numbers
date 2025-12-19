import React, { useState } from 'react'
import { generateQrSvg, elementsFromContent, generateGridSvg } from './lib/qr'

export default function App() {
  const [text, setText] = useState('Hallo Sebastian!')
  const [fg, setFg] = useState('#111827')
  const [bg, setBg] = useState('#ffffff')
  const [ecl, setEcl] = useState<'L' | 'M' | 'Q' | 'H'>('L')
  const [svgFull, setSvgFull] = useState('')
  const [svgPreview, setSvgPreview] = useState('')
  const [elements, setElements] = useState<string[]>([])

  // Grid states
  const [gridSvgFull, setGridSvgFull] = useState<string>('')
  const [gridSvgPreview, setGridSvgPreview] = useState<string>('')
  const [cellSize, setCellSize] = useState<number>(20)
  const [showPattern, setShowPattern] = useState<boolean>(true)
  const [strokeColor, setStrokeColor] = useState<string>('#cbd5e1')
  const [labelFontSize, setLabelFontSize] = useState<number>(12)

  function stripXmlProlog(s: string) {
    return s.replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, '')
  }

  function handleGenerate() {
    try {
      const s = generateQrSvg(text, ecl, 256, fg, bg)
      setSvgFull(s)
      setSvgPreview(stripXmlProlog(s))
      setElements(elementsFromContent(text, ecl))
    } catch (e) {
      console.error(e)
      setSvgFull('')
      setSvgPreview('')
      setElements([])
    }
  }

  function handleDownload() {
    if (!svgFull) return
    const blob = new Blob([svgFull], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr.svg'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function handleGenerateGridSvg() {
    try {
      const s = generateGridSvg(text, {
        ecl,
        cellSize,
        showPattern,
        strokeColor,
        labelColor: '#111827',
        labelFontSize,
        padding: 8,
      })
      setGridSvgFull(s)
      setGridSvgPreview(stripXmlProlog(s))
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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold">QR Color by Numbers</h1>
          <p className="text-sm opacity-90">Erzeuge QR-Codes und exportiere die schwarzen Module als Zellenliste.</p>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium mb-2">Text / URL</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={4} className="w-full p-2 border rounded" />

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm">Foreground</label>
                <input type="color" value={fg} onChange={e => setFg(e.target.value)} className="w-full h-10 p-1 border rounded" />
              </div>
              <div>
                <label className="block text-sm">Background</label>
                <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="w-full h-10 p-1 border rounded" />
              </div>

              <div>
                <label className="block text-sm">Error Correction (ECL)</label>
                <select value={ecl} onChange={e => setEcl(e.target.value as 'L' | 'M' | 'Q' | 'H')} className="w-full p-2 border rounded">
                  <option value="L">L (7%)</option>
                  <option value="M">M (15%)</option>
                  <option value="Q">Q (25%)</option>
                  <option value="H">H (30%)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button onClick={handleGenerate} className="w-full bg-indigo-600 text-white px-4 py-2 rounded">Generieren</button>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={handleDownload} className="bg-gray-800 text-white px-3 py-2 rounded">Download SVG</button>
              <button onClick={() => { navigator.clipboard?.writeText(elements.join(' ')) }} className="bg-gray-200 px-3 py-2 rounded">Kopiere Modul-Liste</button>
            </div>

            <div className="mt-4">
              <h3 className="font-medium">Module ({elements.length})</h3>
              <div className="mt-2 text-sm text-gray-600">
                {elements.length === 0 ? <em>Keine Module generiert</em> : <pre className="whitespace-pre-wrap break-words">{elements.join('\n')}</pre>}
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="font-medium mb-2">Grid / Malvorlage</h3>
              <div className="grid grid-cols-2 gap-2">
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
                <div className="flex items-center gap-2">
                  <input id="showPattern" type="checkbox" checked={showPattern} onChange={e => setShowPattern(e.target.checked)} />
                  <label htmlFor="showPattern" className="text-sm">Show current modules</label>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={handleGenerateGridSvg} className="bg-green-600 text-white px-3 py-2 rounded">Generiere Grid SVG</button>
                <button onClick={handleDownloadGridSvg} className="bg-gray-800 text-white px-3 py-2 rounded">Download Grid SVG</button>
              </div>

            </div>

          </section>

          <section className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
            <h3 className="font-medium mb-4">Vorschau</h3>
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full">
                <h4 className="font-medium mb-2">QR SVG</h4>
                <div className="p-4 bg-white rounded mb-4" dangerouslySetInnerHTML={{ __html: svgPreview || '<em class="text-gray-400">Noch keine Vorschau</em>' }} />

                <h4 className="font-medium mb-2">Grid SVG</h4>
                {gridSvgPreview ? (
                  <div className="overflow-auto border bg-white p-4" dangerouslySetInnerHTML={{ __html: gridSvgPreview }} />
                ) : (
                  <div className="text-gray-400">Noch keine Grid-Vorschau. Klicke auf "Generiere Grid SVG".</div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-gray-500">
        <div className="max-w-4xl mx-auto px-4">Made with ❤️ — deployed on GitHub Pages</div>
      </footer>
    </div>
  )
}
