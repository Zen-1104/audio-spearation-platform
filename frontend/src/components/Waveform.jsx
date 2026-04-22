import React, { useRef, useEffect, useState, useCallback } from 'react'

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function WaveformVisualizer({ audioUrl, color = '#f5a623' }) {
  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const rafRef = useRef(null)
  const analyserRef = useRef(null)
  const audioCtxRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioError, setAudioError] = useState(false)

  const staticBars = useRef(
    Array.from({ length: 52 }, (_, i) =>
      0.1 + 0.38 * Math.abs(Math.sin(i * 0.37 + 0.5)) +
      0.14 * Math.abs(Math.sin(i * 1.15)) +
      0.08 * Math.abs(Math.sin(i * 2.3))
    )
  )

  const drawStatic = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const BAR_COUNT = 52
    const step = W / BAR_COUNT
    const barW = Math.max(2, Math.floor(step * 0.6))
    staticBars.current.forEach((h, i) => {
      const barH = Math.max(4, h * H * 0.82)
      const x = i * step + (step - barW) / 2
      ctx.fillStyle = 'rgba(255,255,255,0.07)'
      ctx.beginPath()
      if (ctx.roundRect) {
        ctx.roundRect(x, H / 2 - barH / 2, barW, barH, 2)
      } else {
        ctx.rect(x, H / 2 - barH / 2, barW, barH)
      }
      ctx.fill()
    })
  }, [])

  const drawLive = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyserRef.current) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)

    const BAR_COUNT = Math.min(52, data.length)
    const step = W / BAR_COUNT
    const barW = Math.max(2, Math.floor(step * 0.6))

    for (let i = 0; i < BAR_COUNT; i++) {
      const norm = data[i] / 255
      const barH = Math.max(4, norm * H * 0.88)
      const x = i * step + (step - barW) / 2
      const y = H / 2 - barH / 2

      if (norm > 0.25) {
        ctx.shadowBlur = norm * 14
        ctx.shadowColor = color
      }

      const grad = ctx.createLinearGradient(0, y, 0, y + barH)
      grad.addColorStop(0, `${color}ff`)
      grad.addColorStop(0.5, color)
      grad.addColorStop(1, `${color}55`)
      ctx.fillStyle = grad

      ctx.beginPath()
      if (ctx.roundRect) {
        ctx.roundRect(x, y, barW, barH, 2)
      } else {
        ctx.rect(x, y, barW, barH)
      }
      ctx.fill()
      ctx.shadowBlur = 0
    }

    rafRef.current = requestAnimationFrame(drawLive)
  }, [color])

  useEffect(() => {
    drawStatic()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close()
      }
    }
  }, [drawStatic])

  const setupCtx = () => {
    if (audioCtxRef.current) return
    try {
      const actx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = actx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.78
      const source = actx.createMediaElementSource(audioRef.current)
      source.connect(analyser)
      analyser.connect(actx.destination)
      audioCtxRef.current = actx
      analyserRef.current = analyser
    } catch (e) {
      console.warn('Web Audio API unavailable:', e)
    }
  }

  const togglePlay = async () => {
    if (!audioRef.current || audioError) return
    setupCtx()
    if (audioCtxRef.current?.state === 'suspended') {
      await audioCtxRef.current.resume()
    }
    if (playing) {
      audioRef.current.pause()
    } else {
      try {
        await audioRef.current.play()
      } catch (e) {
        setAudioError(true)
      }
    }
  }

  const seek = (e) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = ratio * duration
    setCurrentTime(ratio * duration)
  }

  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div style = {{ userSelect: 'none' }}>
      <div
        onClick = {togglePlay}
        style = {{
          cursor: audioError ? 'not-allowed' : 'pointer',
          marginBottom: '10px',
          opacity: audioError ? 0.4 : 1,
        }}
        title = {audioError ? 'Audio unavailable' : playing ? 'Pause' : 'Play'}
      >
        <canvas
          ref = {canvasRef}
          width = {600}
          height = {68}
          style = {{ width: '100%', height: '68px', display: 'block' }}
        />
      </div>

      {/* Controls row */}
      <div style = {{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Play/pause button */}
        <button
          onClick = {togglePlay}
          disabled = {audioError}
          style = {{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: audioError ? 'rgba(248,113,113,0.1)' : `${color}1a`,
            border: `1px solid ${audioError ? 'rgba(248,113,113,0.35)' : color + '55'}`,
            color: audioError ? '#f87171' : color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: audioError ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            flexShrink: 0,
            transition: 'all 150ms ease',
          }}
        >
          {audioError ? '✕' : playing ? '⏸' : '▶'}
        </button>

        {/* Progress bar */}
        <div
          onClick = {seek}
          style = {{
            flex: 1,
            height: '3px',
            background: 'var(--bg-elevated)',
            borderRadius: '2px',
            cursor: 'pointer',
            position: 'relative',
            border: '1px solid var(--border)',
          }}
        >
          <div style = {{
            position: 'absolute',
            left: 0, top: 0,
            height: '100%',
            width: `${progress * 100}%`,
            background: color,
            borderRadius: '2px',
            boxShadow: `0 0 6px ${color}88`,
            transition: 'width 0.1s linear',
          }} />
        </div>

        {/* Time display */}
        <span style = {{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          flexShrink: 0,
          minWidth: '72px',
          textAlign: 'right',
          letterSpacing: '0.05em',
        }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Hidden audio element */}
      <audio
        ref = {audioRef}
        src = {audioUrl}
        crossOrigin = "anonymous"
        preload = "metadata"
        onPlay = {() => { setPlaying(true); drawLive() }}
        onPause = {() => {
          setPlaying(false)
          cancelAnimationFrame(rafRef.current)
          drawStatic()
        }}
        onEnded = {() => {
          setPlaying(false)
          cancelAnimationFrame(rafRef.current)
          drawStatic()
          setCurrentTime(0)
        }}
        onTimeUpdate = {() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata = {() => setDuration(audioRef.current?.duration || 0)}
        onError = {() => setAudioError(true)}
      />
    </div>
  )
}