import React, { useRef, useState, useCallback } from 'react'
import { validateAudioFile, formatBytes } from '../utils/fileValidation'

export default function FileUpload({ file, onFile, error }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = useCallback((files) => {
    if (!files || files.length === 0) return
    const f = files[0]
    const { valid, error: err } = validateAudioFile(f)
    onFile(valid ? f : null, err)
  }, [onFile])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onInputChange = (e) => handleFiles(e.target.files)

  const borderColor = error
    ? 'rgba(248,113,113,0.5)'
    : dragging
      ? 'var(--amber)'
      : file
        ? 'rgba(74,222,128,0.4)'
        : 'var(--border-bright)'

  const bgColor = error
    ? 'rgba(248,113,113,0.04)'
    : dragging
      ? 'rgba(245,166,35,0.06)'
      : file
        ? 'rgba(74,222,128,0.04)'
        : 'var(--bg-card)'

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{
          border: `1.5px dashed ${borderColor}`,
          borderRadius: 'var(--radius-lg)',
          background: bgColor,
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Waveform decoration */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          marginBottom: '20px',
          height: '40px',
        }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 3,
                borderRadius: 2,
                background: file ? 'var(--green)' : dragging ? 'var(--amber)' : 'var(--border-bright)',
                height: `${20 + Math.sin(i * 0.7) * 16}px`,
                transition: 'all 300ms ease',
                opacity: file || dragging ? 0.9 : 0.4,
              }}
            />
          ))}
        </div>

        {file ? (
          <div>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--green)',
              marginBottom: '4px',
              fontWeight: 700,
            }}>
              ✓ FILE SELECTED
            </p>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-primary)',
              fontWeight: 600,
              marginBottom: '6px',
              wordBreak: 'break-all',
            }}>
              {file.name}
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}>
              <span>{formatBytes(file.size)}</span>
              <span>·</span>
              <span>{file.type || 'audio'}</span>
            </div>
          </div>
        ) : (
          <div>
            <p style={{
              fontSize: '15px',
              color: dragging ? 'var(--amber)' : 'var(--text-secondary)',
              fontWeight: 600,
              marginBottom: '6px',
              transition: 'color 200ms ease',
            }}>
              {dragging ? 'Release to upload' : 'Drop your audio here'}
            </p>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
            }}>
              WAV / MP3 · MAX 50MB · OR CLICK TO BROWSE
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".wav,.mp3,audio/wav,audio/mpeg"
          style={{ display: 'none' }}
          onChange={onInputChange}
        />
      </div>

      {/* Validation error */}
      {error && (
        <div style={{
          marginTop: '10px',
          padding: '10px 14px',
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--red)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>⚠</span>
          {error}
        </div>
      )}

      {/* Change file button */}
      {file && (
        <button
          onClick={(e) => { e.stopPropagation(); onFile(null, null); inputRef.current.value = '' }}
          style={{
            marginTop: '10px',
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            padding: '6px 14px',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.06em',
          }}
        >
          ✕ CLEAR FILE
        </button>
      )}
    </div>
  )
}
