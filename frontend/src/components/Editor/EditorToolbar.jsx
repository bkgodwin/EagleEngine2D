import React, { useState } from 'react'
import { useEditor } from '../../store/EditorContext.jsx'
import { exportProject } from '../../api/projects.js'
import { publishGame } from '../../api/games.js'
import Button from '../Common/Button.jsx'
import Modal from '../Common/Modal.jsx'
import GamePlayer from '../GamePlayer/GamePlayer.jsx'

const TOOLS = [
  { id: 'place', label: 'Draw', icon: '✏️' },
  { id: 'erase', label: 'Erase', icon: '🧹' },
  { id: 'select', label: 'Select', icon: '↖️' }
]

export default function EditorToolbar({ canvasRef }) {
  const editor = useEditor()
  const [activeTool, setActiveTool] = useState('place')
  const [showPlay, setShowPlay] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [publishTitle, setPublishTitle] = useState('')
  const [publishDesc, setPublishDesc] = useState('')
  const [publishTags, setPublishTags] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleTool = (tool) => {
    setActiveTool(tool)
    if (canvasRef.current?.setTool) canvasRef.current.setTool(tool)
  }

  const handleSave = async () => {
    setSaving(true)
    await editor.saveProject()
    setSaving(false)
  }

  const handleExport = async () => {
    if (editor.projectId) {
      try {
        const data = await exportProject(editor.projectId)
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${editor.projectName || 'project'}.json`
        a.click()
        URL.revokeObjectURL(url)
      } catch (err) {
        editor.addLog('Export failed: ' + err.message, 'error')
      }
    } else {
      const mapData = canvasRef.current?.exportMapData?.() || {}
      const blob = new Blob([JSON.stringify({ tiles: editor.placedTiles, objects: editor.placedObjects, designConfig: editor.designConfig }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'project.json'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handlePublish = async (e) => {
    e.preventDefault()
    if (!editor.projectId) { setPublishError('Save project first'); return }
    setPublishing(true)
    setPublishError('')
    try {
      const tagsString = publishTags.split(',').map(t => t.trim()).filter(Boolean).join(',')
      await publishGame({ project_id: editor.projectId, title: publishTitle, description: publishDesc, tags: tagsString })
      editor.addLog('Game published!', 'info')
      setShowPublish(false)
    } catch (err) {
      setPublishError(err.response?.data?.detail || 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  const inputStyle = {
    width: '100%', background: '#0f3460', border: '1px solid #2a2a4e', color: '#fff',
    padding: '8px', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', marginBottom: '12px'
  }

  return (
    <>
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <Button size="sm" variant="secondary" loading={saving} onClick={handleSave} disabled={!editor.projectId}>
            💾 Save
          </Button>
          <Button size="sm" variant="ghost" onClick={editor.clearAll}>
            🗑️ Clear
          </Button>
          <Button size="sm" variant="ghost" onClick={editor.undo} disabled={editor.history.past.length === 0}>
            ↩️ Undo
          </Button>
          <Button size="sm" variant="ghost" onClick={editor.redo} disabled={editor.history.future.length === 0}>
            ↪️ Redo
          </Button>
        </div>
        <div className="toolbar-group">
          {TOOLS.map(t => (
            <button key={t.id} className={`tool-btn ${activeTool === t.id ? 'active' : ''}`} onClick={() => handleTool(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="toolbar-group">
          <Button size="sm" onClick={() => setShowPlay(true)}>▶ Play</Button>
          <Button size="sm" variant="secondary" onClick={() => setShowPublish(true)} disabled={!editor.projectId}>
            🚀 Publish
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExport}>
            📦 Export
          </Button>
        </div>
        <div style={{ marginLeft: 'auto', color: '#8892b0', fontSize: '13px' }}>
          {editor.projectName || 'Untitled Project'}
        </div>
      </div>

      <Modal isOpen={showPlay} onClose={() => setShowPlay(false)} title="Play Level">
        <div style={{ height: '500px', overflow: 'hidden' }}>
          <GamePlayer
            gameData={{ game_data: { tiles: editor.placedTiles, objects: editor.placedObjects, designConfig: editor.designConfig } }}
            inline
          />
        </div>
      </Modal>

      <Modal
        isOpen={showPublish}
        onClose={() => { setShowPublish(false); setPublishError('') }}
        title="Publish Game"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowPublish(false)}>Cancel</Button>
            <Button loading={publishing} onClick={handlePublish}>🚀 Publish</Button>
          </>
        }
      >
        {publishError && <div style={{ color: '#e94560', marginBottom: '12px', fontSize: '14px' }}>{publishError}</div>}
        <label style={{ color: '#8892b0', fontSize: '13px' }}>Game Title *</label>
        <input style={inputStyle} value={publishTitle} onChange={e => setPublishTitle(e.target.value)} placeholder="My Awesome Game" />
        <label style={{ color: '#8892b0', fontSize: '13px' }}>Description</label>
        <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={publishDesc} onChange={e => setPublishDesc(e.target.value)} placeholder="Describe your game..." />
        <label style={{ color: '#8892b0', fontSize: '13px' }}>Tags (comma-separated)</label>
        <input style={inputStyle} value={publishTags} onChange={e => setPublishTags(e.target.value)} placeholder="platformer, action, puzzle" />
      </Modal>
    </>
  )
}
