import React from 'react'
import { useEditor } from '../../store/EditorContext.jsx'

const LAYER_COLORS = {
  background: '#87ceeb',
  collision: '#888888',
  decoration: '#4a7c4e',
  objects: '#e94560'
}

export default function LayerPanel() {
  const { layers, selectedLayer, setLayer, toggleLayerVisibility, placedTiles } = useEditor()

  return (
    <div>
      <div style={{ color: '#e94560', fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>LAYERS</div>
      {layers.map(layer => {
        const tileCount = Object.keys(placedTiles[layer.id] || {}).length
        const isActive = selectedLayer === layer.id
        return (
          <div
            key={layer.id}
            onClick={() => setLayer(layer.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', borderRadius: '6px', marginBottom: '4px',
              cursor: 'pointer', border: `1px solid ${isActive ? '#e94560' : '#2a2a4e'}`,
              background: isActive ? 'rgba(233,69,96,0.1)' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: LAYER_COLORS[layer.id] || '#888', flexShrink: 0 }} />
            <span style={{ color: isActive ? '#fff' : '#8892b0', fontSize: '13px', flex: 1 }}>{layer.name}</span>
            <span style={{ color: '#8892b0', fontSize: '11px' }}>{tileCount}</span>
            <button
              onClick={e => { e.stopPropagation(); toggleLayerVisibility(layer.id) }}
              title={layer.visible ? 'Hide layer' : 'Show layer'}
              style={{ background: 'none', border: 'none', color: layer.visible ? '#8892b0' : '#4a5568', cursor: 'pointer', fontSize: '14px', padding: '2px' }}
            >
              {layer.visible ? '👁' : '🙈'}
            </button>
          </div>
        )
      })}
      <div style={{ marginTop: '12px', padding: '8px', background: '#0f3460', borderRadius: '6px', border: '1px solid #2a2a4e' }}>
        <div style={{ color: '#8892b0', fontSize: '11px', lineHeight: 1.6 }}>
          <strong style={{ color: '#e94560' }}>Active layer:</strong> {layers.find(l => l.id === selectedLayer)?.name}<br />
          Tiles placed on the active layer when drawing.
        </div>
      </div>
    </div>
  )
}
