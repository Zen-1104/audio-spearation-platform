import React, { useEffect } from 'react'
import StemCard from '../components/StemCard'
import LiquidBackground from '../components/LiquidBackground'

export default function ResultsPage({ result, onReset, fileName }) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const pageWrapperStyle = {
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    backgroundColor: '#000',
  }

  const backgroundBreakoutStyle = {
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw', height: '150vh',
    zIndex: 0, pointerEvents: 'none',
  }

  if (!result || !result.stems) {
    return (
      <div style = {pageWrapperStyle}>
        <div style = {backgroundBreakoutStyle}><LiquidBackground /></div>
        <div style = {{
          position: 'relative', zIndex: 1,
          display: 'flex', justifyContent: 'center', paddingTop: '100px',
          fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', fontSize: '12px',
        }}>
          FINALIZING ASSETS...
        </div>
      </div>
    )
  }

  const { domain_detected, stems = [], processing_time_seconds } = result

  if (stems.length === 0) {
    return (
      <div style = {pageWrapperStyle}>
        <div style = {backgroundBreakoutStyle}><LiquidBackground /></div>
        <div style = {{
          position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto',
          padding: '120px 24px', textAlign: 'center', animation: 'fadeUp 0.4s ease',
        }}>
          <div style = {{ fontSize: '48px', marginBottom: '24px', opacity: 0.4 }}> ◎ </div>
          <h2 style = {{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
            No Separable Sources Detected
          </h2>
          <p style = {{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
            Try a different file or domain.
          </p>
          <button
            onClick = {onReset}
            style = {{
              padding: '14px 32px', background: '#b829ff', border: 'none',
              borderRadius: '10px', color: '#fff', fontFamily: 'var(--font-display)',
              fontWeight: 800, fontSize: '15px', cursor: 'pointer',
            }}
          >
            Try Another File
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={pageWrapperStyle}>
      <div style={backgroundBreakoutStyle}><LiquidBackground /></div>

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 860, margin: '0 auto',
        padding: '72px 24px 100px',
        animation: 'fadeUp 0.4s ease',
      }}>

        {/* ── PAGE HEADER ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '24px', marginBottom: '40px', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: 32, height: 32, background: '#b829ff', borderRadius: '7px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '12px', color: '#fff',
              }}>
                ST
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.22em' }}>
                SEPARATION COMPLETE
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: 900, color: '#fff',
              letterSpacing: '-0.03em',
              marginBottom: '14px', lineHeight: 1,
            }}>
              {stems.length} Stem{stems.length !== 1 ? 's' : ''} Isolated
            </h1>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              {domain_detected && (
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
                  color: '#b829ff', background: 'rgba(184,41,255,0.12)',
                  border: '1px solid rgba(184,41,255,0.3)',
                  padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.08em',
                }}>
                  ● {domain_detected.toUpperCase()}
                </div>
              )}
              {processing_time_seconds != null && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
                  PROCESSED IN{' '}
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{processing_time_seconds.toFixed(1)}s</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onReset}
            style={{
              padding: '12px 22px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', color: 'rgba(255,255,255,0.7)',
              fontFamily: 'var(--font-mono)', fontSize: '12px',
              letterSpacing: '0.08em', cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'all 200ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
          >
            ← NEW FILE
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(184,41,255,0.5), transparent)', marginBottom: '32px', opacity: 0.5 }} />

        {/* ── FILE INFO STRIP ── */}
        {fileName && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px 18px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            marginBottom: '28px',
            backdropFilter: 'blur(10px)',
            animation: 'fadeUp 0.4s ease 0.1s both',
          }}>
            {/* File icon */}
            <div style={{
              width: 36, height: 36, flexShrink: 0,
              background: 'rgba(184,41,255,0.12)',
              border: '1px solid rgba(184,41,255,0.25)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '14px',
            }}>
              ♪
            </div>

            {/* Filename + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px', fontWeight: 600,
                color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {fileName}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.35)',
                marginTop: '3px',
                letterSpacing: '0.06em',
              }}>
                {stems.length} STEMS · {domain_detected?.toUpperCase()} MODE
                {processing_time_seconds != null && ` · ${processing_time_seconds.toFixed(1)}s`}
              </div>
            </div>

            {/* Status pill */}
            <div style={{
              flexShrink: 0,
              padding: '4px 12px',
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.25)',
              borderRadius: '20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              color: '#4ade80',
              letterSpacing: '0.1em',
            }}>
              ● COMPLETE
            </div>
          </div>
        )}

        {/* ── STEMS: single column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {stems.map((stem, i) => (
            <StemCard key={stem.id} stem={stem} index={i} animDelay={i * 80} />
          ))}
        </div>
      </div>
    </div>
  )
}