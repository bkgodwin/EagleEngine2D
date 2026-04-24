import React from 'react'
import { useEditor } from '../../store/EditorContext.jsx'

const DESIGN_OPTIONS = {
  gameType: { label: 'Game Type', options: ['side-scroller', 'top-down'] },
  camera: { label: 'Camera', options: ['fixed', 'follow', 'smooth-follow', 'bounded'] },
  combat: { label: 'Combat', options: ['none', 'melee', 'projectile', 'hybrid'] },
  multiplayer: { label: 'Multiplayer', options: ['singleplayer', 'co-op', 'pvp'] },
  winCondition: { label: 'Win Condition', options: ['reach-exit', 'collect-items', 'defeat-enemies', 'survive-timer'] },
  difficulty: { label: 'Difficulty', options: ['easy', 'normal', 'hard'] }
}

export default function DesignPanel() {
  const { designConfig, updateDesignConfig } = useEditor()

  const selectStyle = {
    width: '100%', background: '#0f3460', border: '1px solid #2a2a4e',
    color: '#fff', padding: '6px 8px', borderRadius: '4px',
    fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ color: '#e94560', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>GAME DESIGN</div>
      {Object.entries(DESIGN_OPTIONS).map(([key, { label, options }]) => (
        <div key={key}>
          <label style={{ color: '#8892b0', fontSize: '11px', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
            {label}
          </label>
          <select
            style={selectStyle}
            value={designConfig[key] || options[0]}
            onChange={e => updateDesignConfig({ [key]: e.target.value })}
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}
