import React from 'react'

const variants = {
  primary: { background: '#e94560', color: '#fff', border: 'none' },
  secondary: { background: '#1a6bdb', color: '#fff', border: 'none' },
  danger: { background: '#c62828', color: '#fff', border: 'none' },
  ghost: { background: 'transparent', color: '#8892b0', border: '1px solid #8892b0' }
}

const sizes = {
  sm: { padding: '4px 10px', fontSize: '12px' },
  md: { padding: '8px 16px', fontSize: '14px' },
  lg: { padding: '12px 24px', fontSize: '16px' }
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  children,
  type = 'button',
  style = {}
}) {
  const variantStyle = variants[variant] || variants.primary
  const sizeStyle = sizes[size] || sizes.md
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...variantStyle,
        ...sizeStyle,
        borderRadius: '6px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: 'inherit',
        transition: 'opacity 0.2s, transform 0.1s',
        ...style
      }}
    >
      {loading && (
        <span style={{
          width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#fff', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite', display: 'inline-block'
        }} />
      )}
      {children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}
