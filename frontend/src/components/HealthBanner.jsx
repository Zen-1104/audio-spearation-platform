import React from 'react'

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    letterSpacing: '0.05em',
    marginBottom: '24px',
    border: '1px solid',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  retryBtn: {
    marginLeft: 'auto',
    background: 'none',
    border: '1px solid currentColor',
    color: 'inherit',
    padding: '2px 8px',
    borderRadius: 'var(--radius)',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
  }
}

export default function HealthBanner({ healthy, modelsLoaded, checking, retry }) {
  if (checking) {
    return (
      <div style = {{
        ...styles.wrapper,
        background: 'rgba(90,90,106,0.1)',
        borderColor: 'var(--border)',
        color: 'var(--text-muted)',
      }}>
        <div style = {{ ...styles.dot, background: 'var(--text-muted)', animation: 'pulse 1.2s ease infinite' }} />
        CHECKING SERVICE STATUS...
      </div>
    )
  }

  if (!healthy) {
    return (
      <div style = {{
        ...styles.wrapper,
        background: 'rgba(248,113,113,0.08)',
        borderColor: 'rgba(248,113,113,0.3)',
        color: 'var(--red)',
      }}>
        <div style = {{ ...styles.dot, background: 'var(--red)' }} />
        SERVICE UNAVAILABLE — Please try again later.
        <button style = {styles.retryBtn} onClick = {retry}> RETRY </button>
      </div>
    )
  }

  if (!modelsLoaded) {
    return (
      <div style = {{
        ...styles.wrapper,
        background: 'rgba(245,166,35,0.08)',
        borderColor: 'rgba(245,166,35,0.3)',
        color: 'var(--amber)',
      }}>
        <div style = {{ ...styles.dot, background: 'var(--amber)', animation: 'pulse 1.2s ease infinite' }} />
        AI MODELS LOADING — Please wait and refresh.
        <button style = {styles.retryBtn} onClick = {retry}> REFRESH </button>
      </div>
    )
  }

  return (
    <div style = {{
      ...styles.wrapper,
      background: 'rgba(74,222,128,0.07)',
      borderColor: 'rgba(74,222,128,0.25)',
      color: 'var(--green)',
    }}>
      <div style = {{ ...styles.dot, background: 'var(--green)' }} />
      SERVICE ONLINE — MODELS READY
    </div>
  )
}
