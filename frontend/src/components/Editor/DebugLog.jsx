import React, { useEffect, useRef } from 'react'
import { useEditor } from '../../store/EditorContext.jsx'

const TYPE_COLORS = {
  info: '#ffffff',
  warning: '#ffeb3b',
  error: '#e94560',
  success: '#4caf50'
}

export default function DebugLog({ collapsed, onToggle }) {
  const { logs, clearLogs } = useEditor()
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!collapsed) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, collapsed])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px', borderBottom: '1px solid #2a2a4e', background: '#0d0d1e', minHeight: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={onToggle} style={{ background: 'none', border: 'none', color: '#8892b0', cursor: 'pointer', fontSize: '14px' }}>
            {collapsed ? '▸' : '▾'}
          </button>
          <span style={{ color: '#8892b0', fontSize: '12px', fontWeight: 600 }}>DEBUG LOG</span>
          <span style={{ color: '#4a5568', fontSize: '11px' }}>({logs.length} entries)</span>
        </div>
        {!collapsed && (
          <button onClick={clearLogs} style={{ background: 'none', border: '1px solid #2a2a4e', color: '#8892b0', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </div>
      {!collapsed && (
        <div style={{ flex: 1, overflow: 'auto', fontFamily: 'monospace', fontSize: '11px', padding: '4px 8px' }}>
          {logs.length === 0 && <div style={{ color: '#4a5568', padding: '8px' }}>No log entries.</div>}
          {logs.map(entry => (
            <div key={entry.id} style={{ padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: '8px' }}>
              <span style={{ color: '#4a5568', flexShrink: 0 }}>{entry.timestamp}</span>
              <span style={{ color: TYPE_COLORS[entry.type] || '#fff' }}>{entry.message}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
