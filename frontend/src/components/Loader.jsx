import React, { useEffect, useState } from 'react'

const MESSAGES = [
  'Analyzing audio spectrum...',
  'Running source separation...',
  'Classifying audio segments...',
  'Extracting stems...',
  'Computing confidence scores...',
  'Finalizing results...',
]

export default function Loader() {
  const [msgIdx, setMsgIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIdx(i => (i + 1) % MESSAGES.length)
    }, 4000)

    const elapsedTimer = setInterval(() => {
      setElapsed(e => e + 1)
    }, 1000)

    return () => {
      clearInterval(msgTimer)
      clearInterval(elapsedTimer)
    }
  }, [])

  const bars = Array.from({ length: 32 })

  return (
    <div style = {{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px',
      animation: 'fadeIn 0.4s ease',
    }}>
      {/* Animated waveform */}
      <div style = {{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        height: '80px',
        marginBottom: '40px',
      }}>
        {bars.map((_, i) => (
          <div
            key = {i}
            style = {{
              width: 4,
              borderRadius: 2,
              background: `linear-gradient(to top, var(--amber-dim), var(--amber))`,
              animationName: 'waveBar',
              animationDuration: `${0.6 + (i % 5) * 0.15}s`,
              animationDelay: `${(i * 0.05) % 0.8}s`,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
              height: `${30 + Math.sin(i * 0.4) * 25}px`,
              boxShadow: '0 0 8px rgba(245,166,35,0.4)',
            }}
          />
        ))}
      </div>

      {/* Status label */}
      <div style = {{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        letterSpacing: '0.15em',
        color: 'var(--amber)',
        marginBottom: '16px',
        textTransform: 'uppercase',
      }}>
        PROCESSING
      </div>

      {/* Rotating message */}
      <h2 style = {{
        fontFamily: 'var(--font-display)',
        fontSize: '20px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '8px',
        textAlign: 'center',
        minHeight: '30px',
        transition: 'opacity 300ms ease',
      }}>
        {MESSAGES[msgIdx]}
      </h2>

      <p style = {{
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: 'var(--text-muted)',
        marginBottom: '40px',
      }}>
        This may take 10–60 seconds — please don't close the page
      </p>

      {/* Timer + progress */}
      <div style = {{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 24px',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}>
        <div style = {{
          fontFamily: 'var(--font-mono)',
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--amber)',
          letterSpacing: '-0.02em',
          minWidth: '70px',
        }}>
          {String(Math.floor(elapsed / 60)).padStart(2, '0')}:
          {String(elapsed % 60).padStart(2, '0')}
        </div>
        <div>
          <div style = {{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            marginBottom: '4px',
          }}>
            ELAPSED
          </div>
          <div style = {{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
          }}>
            EST. {elapsed < 60 ? `~${60 - elapsed}s remaining` : 'completing soon...'}
          </div>
        </div>
      </div>

      {/* Scanning line effect */}
      <div style = {{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(to right, transparent, var(--amber), transparent)',
        opacity: 0.3,
        animationName: 'scanline',
        animationDuration: '3s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear',
        pointerEvents: 'none',
      }} />
    </div>
  )
}
