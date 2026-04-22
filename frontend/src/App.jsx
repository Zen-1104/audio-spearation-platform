import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useHealth } from './hooks/useHealth'
import { separateAudio } from './services/api'
import HomePage from './pages/Home'
import UploadPage from './pages/UploadPage'
import ProcessingPage from './pages/ProcessingPage'
import ResultsPage from './pages/ResultsPage'

const VIEWS = {
  UPLOAD:     'upload',
  PROCESSING: 'processing',
  RESULTS:    'results',
}

function InnerApp() {
  const navigate    = useNavigate()
  const healthState = useHealth()

  const [view,     setView]     = useState(VIEWS.UPLOAD)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState(null)
  const [fileName, setFileName] = useState(null)

  const handleSubmit = async (file, domain) => {
    setFileName(file.name)
    setError(null)
    setView(VIEWS.PROCESSING)

    try {
      const data = await separateAudio(file, domain)

      if (!data.stems || data.stems.length === 0) {
        setResult({ ...data, stems: [] })
        setView(VIEWS.RESULTS)
        return
      }

      setResult(data)
      setView(VIEWS.RESULTS)
    } catch (err) {
      let msg = 'Processing failed. Please try again.'

      if (!err.response) {
        msg = 'Service unavailable. Please try again later.'
      } else if (err.response.status === 500) {
        msg = 'Processing failed. Try again.'
      } else if (err.response.status === 413) {
        msg = 'File too large. Max 50MB.'
      } else if (err.response.status === 415) {
        msg = 'Only WAV and MP3 files are allowed.'
      }

      setError(msg)
      setView(VIEWS.UPLOAD)
    }
  }

  const handleReset = () => {
    setView(VIEWS.UPLOAD)
    setResult(null)
    setError(null)
    setFileName(null)
    navigate('/')
  }

  const renderView = (domain) => {
    if (view === VIEWS.PROCESSING) {
      return <ProcessingPage fileName={fileName} />
    }

    if (view === VIEWS.RESULTS && result) {
      return <ResultsPage result = {result} onReset = {handleReset} fileName = {fileName} />
    }

    return (
      <UploadPage
        domain = {domain}
        onSubmit = {handleSubmit}
        healthState = {healthState}
        error = {error}
        onClearError = {() => setError(null)}
      />
    )
  }

  return (
    <div style = {{ minHeight: '100vh', position: 'relative' }}>

      <div style = {{
        position:     'fixed',
        top:          '-20%',
        left:         '50%',
        transform:    'translateX(-50%)',
        width:        '600px',
        height:       '300px',
        background:   'radial-gradient(ellipse, rgba(184, 41, 255, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex:       0,
      }} />

      {error && view === VIEWS.UPLOAD && (
        <div style = {{
          position:  'fixed',
          top:       20,
          left:      '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(20, 0, 30, 0.9)',
          border:    '1px solid rgba(248,113,113,0.4)',
          borderRadius: '8px',
          padding:   '14px 20px',
          display:   'flex',
          alignItems: 'center',
          gap:       '10px',
          zIndex:    1000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'fadeUp 0.3s ease',
          maxWidth:  '90vw',
          backdropFilter: 'blur(10px)',
        }}>
          <span style = {{ color: '#ff4d4d', fontSize: '16px' }}> ⚠ </span>
          <span style = {{
            fontFamily: 'var(--font-mono), monospace',
            fontSize:   '13px',
            color:      '#ff4d4d',
          }}>
            {error}
          </span>
          <button
            onClick = {() => setError(null)}
            style = {{
              background: 'none',
              border:     'none',
              color:      'rgba(255,255,255,0.5)',
              fontSize:   '16px',
              padding:    '0 0 0 8px',
              cursor:     'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      <div style = {{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path = "/" element = {<HomePage />} />
          <Route path = "/music" element = {renderView('music')} />
          <Route path = "/nature" element = {renderView('nature')} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <InnerApp />
    </BrowserRouter>
  )
}