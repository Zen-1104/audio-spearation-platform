import React, { useEffect } from 'react'
import Loader from '../components/Loader'
import LiquidBackground from '../components/LiquidBackground'

export default function ProcessingPage({ fileName }) {
  
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style = {{ minHeight: '150vh', width: '100%', position: 'relative', backgroundColor: '#000' }}>
      
      <div style = {{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100vw',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        <LiquidBackground />
      </div>

      {/* content */}
      <div style = {{
        position: 'relative',
        zIndex: 1,
        maxWidth: 600,
        margin: '0 auto',
        padding: '120px 24px 40px',
        animation: 'fadeUp 0.4s ease',
      }}>
        {fileName && (
          <div style = {{
            padding: '12px 18px',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflow: 'hidden',
          }}>
            <span style = {{ color: '#b829ff' }}> ▶ </span>
            <span style = {{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              PROCESSING: {fileName}
            </span>
          </div>
        )}

        <Loader />
      </div>
    </div>
  )
}