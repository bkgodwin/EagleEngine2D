import React from 'react'
import { useEditor } from '../../store/EditorContext.jsx'
import { generateId } from '../../utils/helpers.js'

const CONDITIONS = ['player_enters_zone', 'timer', 'enemy_defeated', 'object_interaction']
const ACTIONS = ['spawn_enemy', 'activate_trap', 'open_door', 'play_sound', 'change_state', 'complete_level']

export default function BehaviorConfig() {
  const { behaviors, updateBehaviors } = useEditor()

  const addBehavior = () => {
    updateBehaviors([...behaviors, {
      id: generateId(),
      condition: 'player_enters_zone',
      conditionParams: '',
      action: 'spawn_enemy',
      actionParams: ''
    }])
  }

  const updateBehavior = (id, field, value) => {
    updateBehaviors(behaviors.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  const deleteBehavior = (id) => {
    updateBehaviors(behaviors.filter(b => b.id !== id))
  }

  const selectStyle = { background: '#0f3460', border: '1px solid #2a2a4e', color: '#fff', padding: '5px 8px', borderRadius: '4px', fontSize: '12px', width: '100%', fontFamily: 'inherit' }
  const inputStyle = { ...selectStyle, marginTop: '4px' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ color: '#e94560', fontSize: '13px', fontWeight: 600 }}>Behavior Rules</span>
        <button onClick={addBehavior} style={{ background: '#e94560', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
          + Add Rule
        </button>
      </div>
      {behaviors.length === 0 && (
        <div style={{ color: '#8892b0', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
          No behavior rules. Click "+ Add Rule" to create one.
        </div>
      )}
      {behaviors.map((b, i) => (
        <div key={b.id} style={{ background: '#0f3460', borderRadius: '8px', padding: '10px', marginBottom: '10px', border: '1px solid #2a2a4e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#8892b0', fontSize: '11px' }}>Rule {i + 1}</span>
            <button onClick={() => deleteBehavior(b.id)} style={{ background: 'none', border: 'none', color: '#e94560', fontSize: '14px', cursor: 'pointer', padding: 0 }}>×</button>
          </div>
          <div style={{ marginBottom: '6px' }}>
            <label style={{ color: '#8892b0', fontSize: '11px' }}>WHEN</label>
            <select style={selectStyle} value={b.condition} onChange={e => updateBehavior(b.id, 'condition', e.target.value)}>
              {CONDITIONS.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
            <input style={inputStyle} placeholder="Param (e.g. zone_id)" value={b.conditionParams} onChange={e => updateBehavior(b.id, 'conditionParams', e.target.value)} />
          </div>
          <div>
            <label style={{ color: '#8892b0', fontSize: '11px' }}>THEN</label>
            <select style={selectStyle} value={b.action} onChange={e => updateBehavior(b.id, 'action', e.target.value)}>
              {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
            </select>
            <input style={inputStyle} placeholder="Param (e.g. enemy_id)" value={b.actionParams} onChange={e => updateBehavior(b.id, 'actionParams', e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  )
}
