import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { updateProject } from '../api/projects.js'
import { generateId } from '../utils/helpers.js'

const EditorContext = createContext(null)

const DEFAULT_LAYERS = [
  { id: 'background', name: 'Background', visible: true, color: '#87ceeb' },
  { id: 'collision', name: 'Collision', visible: true, color: '#888888' },
  { id: 'decoration', name: 'Decoration', visible: true, color: '#4a7c4e' },
  { id: 'objects', name: 'Objects', visible: true, color: '#e94560' }
]

const DEFAULT_DESIGN = {
  gameType: 'side-scroller',
  camera: 'follow',
  combat: 'none',
  multiplayer: 'singleplayer',
  winCondition: 'reach-exit',
  difficulty: 'normal'
}

export function EditorProvider({ children }) {
  const [projectId, setProjectId] = useState(null)
  const [projectName, setProjectName] = useState('Untitled Project')
  const [projectData, setProjectData] = useState({})
  const [selectedTile, setSelectedTile] = useState(null)
  const [selectedObject, setSelectedObject] = useState(null)
  const [selectedLayer, setSelectedLayer] = useState('collision')
  const [layers, setLayers] = useState(DEFAULT_LAYERS)
  const [placedTiles, setPlacedTiles] = useState({})
  const [placedObjects, setPlacedObjects] = useState([])
  const [history, setHistory] = useState({ past: [], future: [] })
  const [designConfig, setDesignConfig] = useState(DEFAULT_DESIGN)
  const [behaviors, setBehaviors] = useState([])
  const [logs, setLogs] = useState([])
  const saving = useRef(false)

  const addLog = useCallback((message, type = 'info') => {
    setLogs(prev => [...prev.slice(-199), {
      id: generateId(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    }])
  }, [])

  const clearLogs = useCallback(() => setLogs([]), [])

  const selectTile = useCallback((tile) => {
    setSelectedTile(tile)
    setSelectedObject(null)
  }, [])

  const selectObject = useCallback((obj) => {
    setSelectedObject(obj)
    setSelectedTile(null)
  }, [])

  const setLayer = useCallback((layerId) => {
    setSelectedLayer(layerId)
  }, [])

  const toggleLayerVisibility = useCallback((layerId) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l))
  }, [])

  const snapshotHistory = useCallback((tiles, objects) => {
    setHistory(prev => ({
      past: [...prev.past.slice(-49), { tiles, objects }],
      future: []
    }))
  }, [])

  const placeTile = useCallback((layer, tileX, tileY, tileId) => {
    setPlacedTiles(prev => {
      const newTiles = {
        ...prev,
        [layer]: { ...(prev[layer] || {}), [`${tileX},${tileY}`]: tileId }
      }
      return newTiles
    })
  }, [])

  const eraseTile = useCallback((layer, tileX, tileY) => {
    setPlacedTiles(prev => {
      const layerTiles = { ...(prev[layer] || {}) }
      delete layerTiles[`${tileX},${tileY}`]
      return { ...prev, [layer]: layerTiles }
    })
  }, [])

  const placeObject = useCallback((objectId, x, y, props = {}) => {
    const entry = { id: generateId(), objectId, x, y, props }
    setPlacedObjects(prev => [...prev, entry])
    return entry
  }, [])

  const removeObject = useCallback((objInstanceId) => {
    setPlacedObjects(prev => prev.filter(o => o.id !== objInstanceId))
  }, [])

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev
      const snapshot = prev.past[prev.past.length - 1]
      setPlacedTiles(snapshot.tiles)
      setPlacedObjects(snapshot.objects)
      return {
        past: prev.past.slice(0, -1),
        future: [{ tiles: placedTiles, objects: placedObjects }, ...prev.future]
      }
    })
  }, [placedTiles, placedObjects])

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev
      const snapshot = prev.future[0]
      setPlacedTiles(snapshot.tiles)
      setPlacedObjects(snapshot.objects)
      return {
        past: [...prev.past, { tiles: placedTiles, objects: placedObjects }],
        future: prev.future.slice(1)
      }
    })
  }, [placedTiles, placedObjects])

  const clearAll = useCallback(() => {
    snapshotHistory(placedTiles, placedObjects)
    setPlacedTiles({})
    setPlacedObjects([])
    addLog('Cleared all tiles and objects', 'warning')
  }, [placedTiles, placedObjects, snapshotHistory, addLog])

  const loadProject = useCallback((project) => {
    setProjectId(project.id)
    setProjectName(project.name || 'Untitled Project')
    const data = project.data || {}
    setProjectData(data)
    setPlacedTiles(data.tiles || {})
    setPlacedObjects(data.objects || [])
    setDesignConfig(data.designConfig || DEFAULT_DESIGN)
    setBehaviors(data.behaviors || [])
    if (data.layers) setLayers(data.layers)
    setHistory({ past: [], future: [] })
    addLog(`Loaded project: ${project.name}`, 'info')
  }, [addLog])

  const saveProject = useCallback(async () => {
    if (!projectId || saving.current) return
    saving.current = true
    try {
      const data = { tiles: placedTiles, objects: placedObjects, designConfig, behaviors, layers }
      await updateProject(projectId, { name: projectName, data })
      addLog('Project saved', 'info')
    } catch (err) {
      addLog(`Save failed: ${err.message}`, 'error')
    } finally {
      saving.current = false
    }
  }, [projectId, projectName, placedTiles, placedObjects, designConfig, behaviors, layers, addLog])

  const updateDesignConfig = useCallback((updates) => {
    setDesignConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const updateBehaviors = useCallback((newBehaviors) => {
    setBehaviors(newBehaviors)
  }, [])

  const value = {
    projectId, setProjectId,
    projectName, setProjectName,
    projectData,
    selectedTile, selectedObject,
    selectedLayer,
    layers,
    placedTiles,
    placedObjects,
    history,
    designConfig,
    behaviors,
    logs,
    selectTile, selectObject, setLayer,
    toggleLayerVisibility,
    placeTile, eraseTile,
    placeObject, removeObject,
    undo, redo, clearAll,
    addLog, clearLogs,
    loadProject, saveProject,
    updateDesignConfig,
    updateBehaviors
  }

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorProvider')
  return ctx
}
