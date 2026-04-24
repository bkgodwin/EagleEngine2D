import React from 'react'
import { useEditor } from '../../store/EditorContext.jsx'

export default function PropertiesPanel() {
  const { selectedTile, selectedObject } = useEditor()

  if (!selectedTile && !selectedObject) {
    return (
      <div style={{ color: '#8892b0', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
        Select a tile or object to see its properties
      </div>
    )
  }

  if (selectedTile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: selectedTile.color, borderRadius: '4px', border: '1px solid #2a2a4e' }} />
          <div>
            <div style={{ color: '#fff', fontWeight: 600 }}>{selectedTile.name}</div>
            <div style={{ color: '#8892b0', fontSize: '12px' }}>{selectedTile.category}</div>
          </div>
        </div>
        <PropRow label="ID" value={selectedTile.id} />
        <PropRow label="Color" value={selectedTile.color} />
        <PropRow label="Solid" value={selectedTile.solid ? 'Yes' : 'No'} />
        <PropRow label="Hazard" value={selectedTile.hazard ? 'Yes' : 'No'} />
      </div>
    )
  }

  if (selectedObject) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: selectedObject.color, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            {selectedObject.icon}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600 }}>{selectedObject.name}</div>
            <div style={{ color: '#8892b0', fontSize: '12px' }}>{selectedObject.category}</div>
          </div>
        </div>
        <PropRow label="ID" value={selectedObject.id} />
        <div style={{ borderTop: '1px solid #2a2a4e', paddingTop: '12px', marginTop: '4px' }}>
          <div style={{ color: '#e94560', fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}>DEFAULT PROPERTIES</div>
          {Object.entries(selectedObject.defaultProps || {}).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#8892b0', fontSize: '12px' }}>{key}</span>
              <span style={{ color: '#fff', fontSize: '12px' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

function PropRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#8892b0', fontSize: '12px' }}>{label}</span>
      <span style={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}>{value}</span>
    </div>
  )
}
