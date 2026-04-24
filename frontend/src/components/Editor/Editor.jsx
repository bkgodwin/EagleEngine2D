import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useEditor } from '../../store/EditorContext.jsx'
import { getProject } from '../../api/projects.js'
import EditorToolbar from './EditorToolbar.jsx'
import TilePalette from './TilePalette.jsx'
import ObjectLibrary from './ObjectLibrary.jsx'
import LayerPanel from './LayerPanel.jsx'
import DesignPanel from './DesignPanel.jsx'
import LevelCanvas from './LevelCanvas.jsx'
import PropertiesPanel from './PropertiesPanel.jsx'
import BehaviorConfig from './BehaviorConfig.jsx'
import DebugLog from './DebugLog.jsx'
import LoadingSpinner from '../Common/LoadingSpinner.jsx'
import './Editor.css'

export default function Editor() {
  const { projectId } = useParams()
  const editor = useEditor()
  const [loading, setLoading] = useState(!!projectId)
  const [leftTab, setLeftTab] = useState('tiles')
  const [rightTab, setRightTab] = useState('properties')
  const [logCollapsed, setLogCollapsed] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }
    getProject(projectId)
      .then(p => {
        editor.loadProject(p)
        setLoading(false)
      })
      .catch(err => {
        editor.addLog(`Failed to load project: ${err.message}`, 'error')
        setLoading(false)
      })
  }, [projectId])

  useEffect(() => {
    if (!projectId) return
    const interval = setInterval(() => {
      editor.saveProject()
    }, 30000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a1a2e' }}>
      <LoadingSpinner />
    </div>
  )

  return (
    <div className="editor">
      <EditorToolbar canvasRef={canvasRef} />
      <div className="editor-body">
        <div className="editor-left-panel">
          <div className="panel-tabs">
            {['tiles', 'objects', 'layers', 'design'].map(tab => (
              <button key={tab} className={`panel-tab ${leftTab === tab ? 'active' : ''}`} onClick={() => setLeftTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="panel-content">
            {leftTab === 'tiles' && <TilePalette />}
            {leftTab === 'objects' && <ObjectLibrary />}
            {leftTab === 'layers' && <LayerPanel />}
            {leftTab === 'design' && <DesignPanel />}
          </div>
        </div>
        <div className="editor-canvas-area">
          <LevelCanvas ref={canvasRef} />
        </div>
        <div className="editor-right-panel">
          <div className="panel-tabs">
            {['properties', 'behaviors'].map(tab => (
              <button key={tab} className={`panel-tab ${rightTab === tab ? 'active' : ''}`} onClick={() => setRightTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="panel-content">
            {rightTab === 'properties' && <PropertiesPanel />}
            {rightTab === 'behaviors' && <BehaviorConfig />}
          </div>
        </div>
      </div>
      <div className={`editor-bottom ${logCollapsed ? 'collapsed' : ''}`} style={{ height: logCollapsed ? '32px' : '180px' }}>
        <DebugLog collapsed={logCollapsed} onToggle={() => setLogCollapsed(c => !c)} />
      </div>
    </div>
  )
}
