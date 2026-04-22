import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LiquidBackground from '../components/LiquidBackground'

export default function HomePage() {
  const navigate = useNavigate()

  const gridRef = useRef(null)
  const [isGridVisible, setIsGridVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsGridVisible(entry.isIntersecting)
    }, { threshold: 0.15 })

    if (gridRef.current) observer.observe(gridRef.current)

    return () => {
      if (gridRef.current) observer.unobserve(gridRef.current)
    }
  }, [])

  return (
    <div style = {{ minHeight: '100vh', width: '100%', position: 'relative', backgroundColor: '#000' }}>
      
      <LiquidBackground />

      <div style = {{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        opacity: 0.05,
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

    {/* Hero text */}
      <div style = {{
        position: 'relative',
        zIndex: 2, 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        padding: '0 24px',
      }}>
        
        <div style = {{
          fontFamily: 'var(--font-mono), "SF Mono", "Fira Code", monospace',
          fontSize: '14px',
          fontWeight: 800, 
          letterSpacing: '0.3em', 
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '32px',
        }}>
          STEM PLATFORM
        </div>

        <h1 style = {{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 'clamp(40px, 8vw, 90px)', 
          fontWeight: 900, 
          lineHeight: 1.05, 
          letterSpacing: '-0.03em', 
          color: '#ffffff',
          marginBottom: '32px',
        }}>
          Audio Source <br />
          <span style = {{ color: 'var(--amber)' }}> Separation </span>
        </h1>

        {/* Paragraph text */}
        <p style = {{
          fontFamily: '"Plus Jakarta Sans", sans-serif', 
          fontSize: '15px',
          fontWeight: 400, 
          maxWidth: '500px', 
          lineHeight: 1.8, 
          letterSpacing: '0.02em',
          color: 'rgba(255, 255, 255, 0.6)', 
          margin: '0 auto 56px auto', 
        }}>
          Upload any audio and our AI will isolate each sound source,
          classify it, and give you individual stems to download.
        </p>
        {/* Scroll indicator */}
        <div style = {{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          color: 'rgba(255, 255, 255, 0.5)',
          fontFamily: 'var(--font-mono), "SF Mono", monospace',
          fontSize: '13px',
          fontWeight: 700, 
          letterSpacing: '0.2em',
          animation: 'bounce 2s infinite',
        }}>
          <span> SCROLL </span>
          <span> ↓ </span>
        </div>
      </div>

      <div style = {{
        position: 'relative',
        zIndex: 2,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        background: 'linear-gradient(to bottom, transparent, var(--bg-base) 30%)',
      }}>
        <div style = {{
          fontFamily: 'var(--font-mono), "SF Mono", "Fira Code", monospace',
          fontSize: '14px',
          fontWeight: 800,
          letterSpacing: '0.3em',
          color: 'var(--text-muted)',
          marginBottom: '48px',
        }}>
          SELECT YOUR DOMAIN
        </div>

        <div 
        ref = {gridRef}
        style = {{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '80px',
          maxWidth: '1040px',
          width: '100%',
        }}>
          <DomainCard
            title = "Music"
            description = "Separate vocals, drums, bass, and melody from any track. Get genre classification per stem."
            delay = "0.1s"
            image = "/music-bg.jpg"
            isVisible = {isGridVisible}
            onClick = {() => navigate('/music')}
          />
          <DomainCard
            title = "Nature"
            description = "Isolate environmental sounds from any soundscape. Identify species and ambient sources."
            delay = "0.1s"
            image = "/nature-bg.jpg"
            isVisible = {isGridVisible}
            onClick = {() => navigate('/nature')}
          />
        </div>
      </div>
    </div>
  )
}

function DomainCard({ title, description, image, delay, onClick, isVisible }) {
  
  return (
    <div
      className = {`reveal-wrapper ${isVisible ? 'visible' : ''}`}
      style = {{ transitionDelay: isVisible ? delay : '0s' }} 
    >
      <div className = "agency-card" onClick = {onClick}>
        <div className = "agency-card-visual">
          <div className = "agency-card-inner">
            <img 
            src = {image} 
            alt = {title} 
            style = {{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        <div style = {{ padding: '0 8px' }}>
          <h2
            className = "agency-card-title"
            style = {{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '16px',
              letterSpacing: '-0.02em'
            }}
          >
            {title}
          </h2>

          <p style = {{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            color: 'rgba(255, 255, 255, 0.55)',
            fontSize: '15px',
            lineHeight: 1.7,
            letterSpacing: '0.01em'
          }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}