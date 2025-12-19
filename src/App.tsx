import React, { useState } from 'react'
import { generateQrSvg, elementsFromContent } from './lib/qr'

export default function App() {
  const [text, setText] = useState('Hallo Sebastian!')
  const [fg, setFg] = useState('#111827')
  const [bg, setBg] = useState('#ffffff')
  const [ecl, setEcl] = useState<'L' | 'M' | 'Q' | 'H'>('L')
  const [svg, setSvg] = useState('')
  const [elements, setElements] = useState<string[]>([])

  function handleGenerate() {
    try {
      const s = generateQrSvg(text, ecl, 256, fg, bg)
      setSvg(s)
      setElements(elementsFromContent(text, ecl))
    } catch (e) {
      console.error(e)
      setSvg('')
      setElements([])
    }
  }

  function handleDownload() {
    if (!svg) return
    const blob = new Blob([svg], {type: 'image/svg+xml'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr.svg'
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
            <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
                      className="w-full p-2 border rounded"/>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm">Foreground</label>
                <input type="color" value={fg} onChange={e => setFg(e.target.value)}
                       className="w-full h-10 p-1 border rounded"/>
              </div>
              <div>
                <label className="block text-sm">Background</label>
                <input type="color" value={bg} onChange={e => setBg(e.target.value)}
                       className="w-full h-10 p-1 border rounded"/>
              </div>

              <div>
                <label className="block text-sm">Error Correction (ECL)</label>
                <select value={ecl} onChange={e => setEcl(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                        className="w-full p-2 border rounded">
                  <option value="L">L (7%)</option>
                  <option value="M">M (15%)</option>
                  <option value="Q">Q (25%)</option>
                  <option value="H">H (30%)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button onClick={handleGenerate}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded">Generieren
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={handleDownload} className="bg-gray-800 text-white px-3 py-2 rounded">Download SVG
              </button>
              <button onClick={() => {
                navigator.clipboard?.writeText(elements.join(' '))
              }} className="bg-gray-200 px-3 py-2 rounded">Kopiere Modul-Liste
              </button>
            </div>

            <div className="mt-4">
              <h3 className="font-medium">Module ({elements.length})</h3>
              <div className="mt-2 text-sm text-gray-600">
                {elements.length === 0 ? <em>Keine Module generiert</em> :
                  <pre className="whitespace-pre-line break-words">
                    {elements.join(' ')}
                  </pre>}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
            <h3 className="font-medium mb-4">Vorschau</h3>
            <div className="w-full h-full flex items-center justify-center">
              {svg ? (
                <div className="p-4 bg-white rounded" dangerouslySetInnerHTML={{__html: svg}}/>
              ) : (
                <div className="text-gray-400">Noch keine Vorschau. Klicke auf Generieren.</div>
              )}
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
