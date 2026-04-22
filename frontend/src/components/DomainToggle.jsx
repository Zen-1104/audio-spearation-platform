import React from 'react'

const DOMAINS = [
  { value: 'auto', label: 'AUTO', icon: '◈', desc: 'Detect automatically' },
  { value: 'nature', label: 'NATURE', icon: '◉', desc: 'Environmental sounds' },
  { value: 'music', label: 'MUSIC', icon: '◆', desc: 'Instruments & vocals' },
]

export default function DomainToggle({ value, onChange }) {
  return (
    <div>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        letterSpacing: '0.12em',
        color: 'var(--text-muted)',
        marginBottom: '10px',
      }}>
        SEPARATION DOMAIN
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
      }}>
        {DOMAINS.map(d => {
          const active = value === d.value
          return (
            <button
              key={d.value}
              onClick={() => onChange(d.value)}
              style={{
                padding: '14px 12px',
                borderRadius: 'var(--radius)',
                border: `1px solid ${active ? 'var(--amber)' : 'var(--border)'}`,
                background: active ? 'var(--amber-glow)' : 'var(--bg-card)',
                color: active ? 'var(--amber)' : 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 200ms ease',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '18px' }}>{d.icon}</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.1em',
              }}>
                {d.label}
              </span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '10px',
                color: active ? 'rgba(245,166,35,0.7)' : 'var(--text-muted)',
                textAlign: 'center',
              }}>
                {d.desc}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
