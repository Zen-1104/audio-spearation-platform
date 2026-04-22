import React, { useState, useRef } from 'react'
import { getStemAudioUrl, downloadStem } from '../services/api'
import { formatDuration } from '../utils/fileValidation'
import WaveformPlayer from './WaveformPlayer'

const STEM_PALETTE = [
  { bg: 'rgba(184,41,255,0.10)', text: '#b829ff', border: 'rgba(184,41,255,0.35)', glow: 'rgba(184,41,255,0.18)', hex: '#b829ff' },
  { bg: 'rgba(0,212,255,0.10)',  text: '#00d4ff', border: 'rgba(0,212,255,0.35)',  glow: 'rgba(0,212,255,0.18)',  hex: '#00d4ff' },
  { bg: 'rgba(255,45,155,0.10)', text: '#ff2d9b', border: 'rgba(255,45,155,0.35)', glow: 'rgba(255,45,155,0.18)', hex: '#ff2d9b' },
  { bg: 'rgba(255,200,50,0.10)', text: '#ffc832', border: 'rgba(255,200,50,0.35)', glow: 'rgba(255,200,50,0.18)', hex: '#ffc832' },
]

function ConfidenceReadout({ pct, colors, animDelay = 0 }) {
  const filled = Math.round((pct / 100) * 5)
  const heights = [7, 10, 13, 16, 19]
  return (
    <div style = {{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
      {/* Bars */}
      <div style = {{ display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
        {heights.map((h, i) => (
          <div key = {i} style={{
            width: '4px',
            height: `${h}px`,
            borderRadius: '2px',
            background: i < filled ? colors.text : 'rgba(255,255,255,0.1)',
            boxShadow: i < filled ? `0 0 5px ${colors.text}99` : 'none',
            transition: `background 0.3s ease ${animDelay + i * 80}ms, box-shadow 0.3s ease ${animDelay + i * 80}ms`,
          }} />
        ))}
        <span style = {{
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
          fontWeight: 700,
          color: colors.text,
          marginLeft: '7px',
          lineHeight: 1,
          alignSelf: 'center',
        }}>
          {pct}%
        </span>
      </div>
      {/* Label */}
      <span style = {{
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        letterSpacing: '0.15em',
        color: 'rgba(255,255,255,0.3)',
      }}>
        CONFIDENCE
      </span>
    </div>
  )
}

function SpectrogramLightbox({ src, name, onClose }) {
  return (
    <div
      onClick = {onClose}
      style = {{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        backdropFilter: 'blur(10px)',
        animation: 'fadeUp 0.2s ease',
        cursor: 'zoom-out',
      }}
    >
      <div
        onClick = {e => e.stopPropagation()}
        style = {{
          maxWidth: '90vw', maxHeight: '88vh',
          borderRadius: '12px', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
          cursor: 'default',
        }}
      >
        <div style = {{
          padding: '10px 16px',
          background: 'rgba(15,7,28,0.98)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style = {{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}>
            {name} — SPECTROGRAM
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0 0 0 20px' }}> × </button>
        </div>
        <img
          src = {src}
          alt = {`${name} spectrogram`}
          style = {{ display: 'block', maxWidth: '100%', maxHeight: 'calc(88vh - 44px)', objectFit: 'contain' }}
        />
      </div>
    </div>
  )
}

export default function StemCard({ stem, index, animDelay = 0 }) {
  const [downloading, setDownloading] = useState(false)
  const [dlError, setDlError] = useState(null)
  const [spectrogramOpen, setSpectrogramOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const specRef = useRef(null)

  const colors = STEM_PALETTE[index % STEM_PALETTE.length]
  const pct = Math.round((stem.confidence ?? 0) * 100)
  const audioUrl = getStemAudioUrl(stem.audio_url)
  const spectrogramUrl = stem.spectrogram_url ? getStemAudioUrl(stem.spectrogram_url) : null

  const handleDownload = async () => {
    setDownloading(true)
    setDlError(null)
    try {
      await downloadStem(stem.audio_url, stem.name)
    } catch {
      setDlError('Download failed. Try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      {lightboxOpen && spectrogramUrl && (
        <SpectrogramLightbox src = {spectrogramUrl} name = {stem.name} onClose = {() => setLightboxOpen(false)} />
      )}

      <div
        className = "page-enter"
        style = {{
          animationDelay: `${animDelay}ms`,
          background: hovered
            ? 'linear-gradient(135deg, rgba(22,11,38,0.78) 0%, rgba(10,5,22,0.88) 100%)'
            : 'linear-gradient(135deg, rgba(15,7,28,0.72) 0%, rgba(8,4,16,0.82) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${hovered ? colors.border : 'rgba(255,255,255,0.07)'}`,
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
          boxShadow: hovered
            ? `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${colors.border}, inset 0 1px 0 rgba(255,255,255,0.05)`
            : '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
          transition: 'border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease, background 220ms ease',
        }}
        onMouseEnter = {() => setHovered(true)}
        onMouseLeave = {() => setHovered(false)}
      >
        {/* Left edge accent */}
        <div style = {{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
          background: `linear-gradient(to bottom, ${colors.text}, transparent)`,
          opacity: hovered ? 0.9 : 0.35,
          transition: 'opacity 220ms ease',
        }} />

        {/* ── STEM INFO HEADER ── */}
        <div style = {{ padding: '18px 22px 14px 22px' }}>

          {/* STEM 01 badge */}
          <div style = {{ marginBottom: '6px' }}>
            <span style = {{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.18em',
              color: colors.text,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              padding: '2px 8px',
            }}>
              STEM {String(index + 1).padStart(2, '0')}
            </span>
          </div>

          {/* Name + Tag | Confidence */}
          <div style = {{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            {/* name + classification tag */}
            <div style = {{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <h3 style = {{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-0.01em',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}>
                {stem.name}
              </h3>
              <span style = {{
                padding: '3px 11px',
                borderRadius: '20px',
                background: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.07em',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {stem.label}
              </span>
              {stem.bpm && (
                <span style = {{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  ♩ {stem.bpm}
                </span>
              )}
              {stem.duration_seconds && (
                <span style = {{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.3)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {formatDuration(stem.duration_seconds)}
                </span>
              )}
            </div>

            {/* confidence readout */}
            <ConfidenceReadout pct = {pct} colors = {colors} animDelay = {animDelay + 200} />
          </div>

          {/* Unrecognised fallback */}
          {!stem.recognised && stem.top3?.length > 0 && (
            <div style = {{ marginTop: '10px' }}>
              <div style = {{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginBottom: '4px' }}>
                POSSIBLE MATCHES
              </div>
              {stem.top3.map((item, i) => (
                <div key = {i} style = {{
                  display: 'flex', justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)', fontSize: '11px',
                  color: i === 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                  padding: '2px 0',
                }}>
                  <span>{item.label}</span>
                  <span>{Math.round(item.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style = {{
          height: '1px', margin: '0 22px',
          background: `linear-gradient(to right, ${colors.border}, transparent)`,
          opacity: 0.4, marginBottom: '14px',
        }} />

        {/* ── WAVEFORM PLAYER ── */}
        <div style = {{ padding: '0 18px 14px 18px' }}>
          <WaveformPlayer audioUrl={audioUrl} accentColor={colors.hex} />
        </div>

        {/* Divider */}
        <div style = {{ height: '1px', margin: '0 22px 14px', background: 'rgba(255,255,255,0.05)' }} />

        {/* ── DOWNLOAD ── */}
        <div style = {{ padding: '0 18px 14px' }}>
          <button
            onClick = {handleDownload}
            disabled = {downloading}
            style = {{
              width: '100%', padding: '11px',
              background: downloading ? 'rgba(255,255,255,0.04)' : colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '10px',
              color: colors.text,
              fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700,
              letterSpacing: '0.12em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: downloading ? 'default' : 'pointer',
              transition: 'all 200ms ease',
            }}
            onMouseEnter = {e => !downloading && (e.currentTarget.style.background = colors.border)}
            onMouseLeave = {e => !downloading && (e.currentTarget.style.background = colors.bg)}
          >
            {downloading ? (
              <>
                <div style = {{
                  width: '11px', height: '11px',
                  border: '2px solid currentColor', borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animationName: 'spin', animationDuration: '0.6s',
                  animationIterationCount: 'infinite', animationTimingFunction: 'linear',
                }} />
                DOWNLOADING...
              </>
            ) : <> ⬇ DOWNLOAD WAV </>}
          </button>
          {dlError && (
            <p style = {{ marginTop: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ff4444', textAlign: 'center' }}>
              ⚠ {dlError}
            </p>
          )}
        </div>

        {/* ── SPECTROGRAM ── */}
        {spectrogramUrl && (
          <div>
            {/* Toggle button */}
            <button
              onClick = {() => setSpectrogramOpen(o => !o)}
              style = {{
                width: '100%',
                padding: '11px 22px',
                background: spectrogramOpen ? `rgba(255,255,255,0.04)` : 'transparent',
                border: 'none',
                borderTop: `1px solid ${spectrogramOpen ? colors.border : 'rgba(255,255,255,0.06)'}`,
                color: spectrogramOpen ? colors.text : 'rgba(255,255,255,0.32)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.15em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 220ms ease',
              }}
              onMouseEnter = {e => { if (!spectrogramOpen) e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              onMouseLeave = {e => { if (!spectrogramOpen) e.currentTarget.style.color = 'rgba(255,255,255,0.32)' }}
            >
              <span style = {{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style = {{ fontSize: '12px' }}> ◈ </span> SPECTROGRAM
              </span>
              <span style = {{
                display: 'inline-block',
                transform: spectrogramOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 300ms ease',
                fontSize: '8px', opacity: 0.7,
              }}> ▼ </span>
            </button>

            <div
              ref = {specRef}
              style = {{
                maxHeight: spectrogramOpen ? '300px' : '0px',
                overflow: 'hidden',
                transition: 'max-height 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div
                onClick = {() => setLightboxOpen(true)}
                style = {{ cursor: 'zoom-in', position: 'relative', overflow: 'hidden' }}
                title = "Click to enlarge"
              >
                <div
                  style = {{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'all 200ms ease', zIndex: 2,
                  }}
                  onMouseEnter = {e => {
                    e.currentTarget.style.opacity = '1'
                    e.currentTarget.style.background = 'rgba(0,0,0,0.38)'
                  }}
                  onMouseLeave = {e => {
                    e.currentTarget.style.opacity = '0'
                    e.currentTarget.style.background = 'rgba(0,0,0,0)'
                  }}
                >
                  <div style = {{
                    background: 'rgba(0,0,0,0.75)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: '8px', padding: '8px 14px',
                    fontFamily: 'var(--font-mono)', fontSize: '11px',
                    color: '#fff', letterSpacing: '0.1em',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    🔍 ENLARGE
                  </div>
                </div>
                <img
                  src = {spectrogramUrl}
                  alt = {`${stem.name} spectrogram`}
                  style = {{ width: '100%', display: 'block', maxHeight: '260px', objectFit: 'cover' }}
                  onError = {e => { e.currentTarget.parentElement.parentElement.style.display = 'none' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}