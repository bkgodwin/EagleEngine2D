import React, { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children, footer }) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        style={{
          background: '#1a1a2e', border: '1px solid #2a2a4e', borderRadius: '12px',
          padding: '24px', minWidth: '400px', maxWidth: '600px', width: '100%',
          maxHeight: '90vh', overflow: 'auto', position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 id="modal-title" style={{ color: '#fff', fontSize: '20px' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#8892b0',
              fontSize: '20px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px'
            }}
            aria-label="Close modal"
          >×</button>
        </div>
        <div>{children}</div>
        {footer && <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  )
}
