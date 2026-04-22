import React, { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

function LedVolumeControl({ volume, onChange }) {
  const containerRef = useRef(null)
  const TOTAL_LEDS = 14

  const updateVolume = (e) => {
    const rect = containerRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    let newVol = 1 - (y / rect.height)
    newVol = Math.max(0, Math.min(1, newVol))
    onChange(newVol)
  }

  const handlePointerDown = (e) => {
    containerRef.current.setPointerCapture(e.pointerId)
    updateVolume(e)
  }

  const handlePointerMove = (e) => {
    if (containerRef.current.hasPointerCapture(e.pointerId)) {
      updateVolume(e)
    }
  }

  return (
    <div
      ref = {containerRef}
      onPointerDown = {handlePointerDown}
      onPointerMove = {handlePointerMove}
      style = {{
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '3px',
        padding: '2px',
        cursor: 'pointer',
        touchAction: 'none',
      }}
    >
      {Array.from({ length: TOTAL_LEDS }).map((_, i) => {
        const isActive = i < volume * TOTAL_LEDS
        const ratio = i / TOTAL_LEDS
        const r = 255
        const g = Math.floor(50 + (ratio * 200))
        const b = 50
        const color = `rgb(${r}, ${g}, ${b})`
        return (
          <div key = {i} style = {{
            width: '32px',
            height: '4px',
            borderRadius: '1px',
            backgroundColor: isActive ? color : 'rgba(255, 255, 255, 0.08)',
            boxShadow: isActive ? `0 0 6px ${color}` : 'none',
            transition: 'all 0.05s ease',
          }} />
        )
      })}
    </div>
  )
}

export default function WaveformPlayer({ audioUrl, accentColor = '#b829ff' }) {
  const containerRef = useRef(null)
  const mediaRef = useRef(null)
  const wavesurferRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    if (!containerRef.current || !mediaRef.current || !audioUrl) return

    const ws = WaveSurfer.create({
      container: containerRef.current,
      media: mediaRef.current,
      waveColor: 'rgba(255, 255, 255, 0.15)',
      progressColor: accentColor,
      cursorColor: 'rgba(255,255,255,0.6)',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 56,
      normalize: true,
      dragToSeek: true,
    })

    ws.on('ready', () => {
      wavesurferRef.current = ws
      ws.setVolume(volume)
    })
    ws.on('play', () => setIsPlaying(true))
    ws.on('pause', () => setIsPlaying(false))
    ws.on('finish', () => setIsPlaying(false))

    let wasPlayingBeforeDrag = false
    const handlePointerDown = () => {
      if (ws.isPlaying()) { wasPlayingBeforeDrag = true; ws.pause() }
      else { wasPlayingBeforeDrag = false }
    }
    const handlePointerUp = () => {
      if (wasPlayingBeforeDrag) { ws.play(); wasPlayingBeforeDrag = false }
    }

    const containerNode = containerRef.current
    containerNode.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      containerNode.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
      ws.destroy()
    }
  }, [audioUrl, accentColor])

  const togglePlay = () => {
    wavesurferRef.current?.playPause()
  }

  const handleVolumeChange = (newVol) => {
    setVolume(newVol)
    wavesurferRef.current?.setVolume(newVol)
  }

  return (
    <div style = {{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
      <audio ref = {mediaRef} src = {audioUrl} preload = "auto" style = {{ display: 'none' }} />

      {/* Play / pause */}
      <button
        onClick = {togglePlay}
        style = {{
          width: '44px', height: '44px',
          borderRadius: '50%',
          backgroundColor: accentColor,
          color: '#fff',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'opacity 200ms ease',
          boxShadow: `0 0 16px ${accentColor}66`,
        }}
        onMouseEnter = {e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave = {e => e.currentTarget.style.opacity = '1'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Waveform */}
      <div ref = {containerRef} style = {{ flex: 1, cursor: 'pointer' }} />

      {/* volume meter */}
      <div style = {{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <LedVolumeControl volume = {volume} onChange = {handleVolumeChange} />
      </div>
    </div>
  )
}