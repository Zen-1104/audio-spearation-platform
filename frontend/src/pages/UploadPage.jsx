import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FileUpload from '../components/FileUpload'
import HealthBanner from '../components/HealthBanner'
import LiquidBackground from '../components/LiquidBackground'
import WaveformPlayer from '../components/WaveformPlayer'

const DOMAIN_CONFIG = {
  music: {
    title: 'Music',
    description: 'Upload a music track and our AI will separate vocals, drums, bass, and melody — then classify the genre of each stem.',
    icon: '♪',
    hint: 'Best with: full songs, instrumentals, mixed tracks',
  },
  nature: {
    title: 'Nature',
    description: 'Upload an environmental recording and our AI will identify and isolate individual sound sources like birds, rain, wind, and insects.',
    icon: '◈',
    hint: 'Best with: outdoor recordings, soundscapes, ambient audio',
  },
}

export default function UploadPage({ onSubmit, healthState, domain, error, onClearError }) {
  const navigate = useNavigate()
  const audioRef = useRef(null)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const config = DOMAIN_CONFIG[domain] || DOMAIN_CONFIG.music
  const canSubmit = file && !fileError && healthState.healthy && healthState.modelsLoaded

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      setIsPlaying(false)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleFile = (f, err) => {
    setTimeout(() => {
      setFile(f)
      setFileError(err)
      setIsPlaying(false)
    }, 50)
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit(file, domain)
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div style = {{ 
      minHeight: '150vh', 
      width: '100%', 
      position: 'relative', 
    }}>
      
      <LiquidBackground />

      <div
        className = "page-enter"
        style = {{
          position: 'relative',
          zIndex: 1, 
          maxWidth: 640,
          margin: '0 auto',
          padding: '80px 24px 80px', 
        }}
      >
        <button
          onClick = {() => navigate('/')}
          style = {{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)', 
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            padding: '0',
            marginBottom: '40px',
            transition: 'color 200ms ease',
          }}
          onMouseEnter = {e => e.currentTarget.style.color = '#fff'}
          onMouseLeave = {e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
        >
          ← BACK TO DOMAINS
        </button>

        <div style = {{ marginBottom: '40px' }}>
          <div style = {{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style = {{
              width: 40,
              height: 40,
              background: '#b829ff', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '18px',
              color: '#fff',
            }}>
              {config.icon}
            </div>
            <span style = {{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
            }}>
              {config.title} Mode
            </span>
          </div>

          <h1 style = {{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 6vw, 56px)', 
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            marginBottom: '16px',
          }}>
            {config.title} Source <br />
            <span style = {{ color: '#b829ff' }}> Separation </span> 
          </h1>

          <p style = {{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            color: 'rgba(255, 255, 255, 0.65)',
            fontSize: '16px',
            maxWidth: '480px',
            lineHeight: 1.7,
            marginBottom: '12px',
          }}>
            {config.description}
          </p>

          <p style = {{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '0.05em',
          }}>
            {config.hint}
          </p>
        </div>

        <HealthBanner {...healthState} />

        <div style = {{ marginBottom: '24px' }}>

          <FileUpload 
          file = {file} 
          onFile = {handleFile} 
          error = {fileError} />

        </div>

        {previewUrl && file && (
          <div style = {{
            marginBottom: '24px',
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)', 
            borderRadius: '12px',
            padding: '20px',
            animation: 'fadeUp 0.3s ease',
          }}>
            <div style = {{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style = {{ flex: 1, overflow: 'hidden' }}>
                <div style = {{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  color: '#ffffff',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {file.name}
                </div>
                <div style = {{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                  {formatSize(file.size)} · {file.type || 'audio'}
                </div>
              </div>

              <button
                onClick = {() => { setFile(null); setFileError(null); setPreviewUrl(null); }}
                style = {{
                  background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '28px', cursor: 'pointer', padding: '0', lineHeight: 1, flexShrink: 0,
                  transition: 'color 200ms ease'
                }}
                onMouseEnter = {e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave = {e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
              >
                ×
              </button>
            </div>
            
            <WaveformPlayer audioUrl = {previewUrl} />
          </div>
        )}

        <button
          onClick = {handleSubmit}
          disabled = {!canSubmit}
          style = {{
            width: '100%',
            padding: '18px',
            background: canSubmit ? '#b829ff' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${canSubmit ? '#b829ff' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '12px',
            color: canSubmit ? '#fff' : 'rgba(255, 255, 255, 0.3)',
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            fontWeight: 800,
            letterSpacing: '0.02em',
            transition: 'all 200ms ease',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter = {e => canSubmit && (e.currentTarget.style.background = '#d05cff')}
          onMouseLeave = {e => canSubmit && (e.currentTarget.style.background = '#b829ff')}
        >
          {!healthState.healthy
            ? '— Service Unavailable —'
            : !healthState.modelsLoaded
              ? '— Models Loading —'
              : !file
                ? `Select a ${config.title} File to Continue`
                : `Separate ${config.title} · ${file.name}`}
        </button>
      </div>
    </div>
  )
}