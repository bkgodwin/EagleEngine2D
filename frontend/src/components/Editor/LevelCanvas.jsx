import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { useEditor } from '../../store/EditorContext.jsx'
import PhysicsConfig from '../../game/PhysicsConfig.js'

const LevelCanvas = forwardRef(function LevelCanvas(props, ref) {
  const editor = useEditor()
  const containerRef = useRef(null)
  const gameRef = useRef(null)
  const sceneRef = useRef(null)
  const containerId = 'editor-canvas-container'

  useEffect(() => {
    let game = null
    let mounted = true

    const init = async () => {
      const Phaser = (await import('phaser')).default
      const EditorScene = (await import('../../game/EditorScene.js')).default
      const { createPhaserGame, destroyPhaserGame } = await import('../../game/PhaserGame.js')

      if (!mounted || !containerRef.current) return

      const scene = new EditorScene()
      sceneRef.current = scene

      const callbacks = {
        onTilePlaced: (layer, tx, ty, tileId) => {
          if (tileId === null) {
            editor.eraseTile(layer, tx, ty)
          } else {
            editor.placeTile(layer, tx, ty, tileId)
          }
        },
        onObjectPlaced: (entry) => {
          editor.placeObject(entry.objectId, entry.x, entry.y, entry.props)
        },
        onSelectionChanged: () => {},
        onLog: (msg, type) => editor.addLog(msg, type),
        getEditorState: () => ({ tiles: editor.placedTiles, objects: editor.placedObjects })
      }

      scene._initCallbacks = callbacks

      game = createPhaserGame(containerId, [{
        ...scene,
        init: function(data) { EditorScene.prototype.init.call(this, { ...callbacks, ...data }) }
      }], {
        width: containerRef.current.offsetWidth,
        height: Math.max(containerRef.current.offsetHeight - 40, 400),
        physics: PhysicsConfig,
        backgroundColor: '#1a1a2e',
        scene: {
          key: 'EditorScene',
          init(data) {
            this._callbacks = callbacks
            this._getEditorState = callbacks.getEditorState
          },
          preload() {},
          create() { EditorScene.prototype.create.call(this) },
          update() { EditorScene.prototype.update.call(this) }
        }
      })

      gameRef.current = game

      if (mounted) {
        const actualScene = game.scene.getScene('EditorScene')
        if (actualScene) {
          Object.setPrototypeOf(actualScene, EditorScene.prototype)
          actualScene.callbacks = callbacks
          actualScene.getEditorState = callbacks.getEditorState
          sceneRef.current = actualScene
        }
      }
    }

    const initDirect = async () => {
      const Phaser = (await import('phaser')).default
      const EditorScene = (await import('../../game/EditorScene.js')).default
      const { createPhaserGame } = await import('../../game/PhaserGame.js')

      if (!mounted || !containerRef.current) return

      const callbacks = {
        onTilePlaced: (layer, tx, ty, tileId) => {
          if (tileId === null) editor.eraseTile(layer, tx, ty)
          else editor.placeTile(layer, tx, ty, tileId)
        },
        onObjectPlaced: (entry) => {
          editor.placeObject(entry.objectId, entry.x, entry.y, entry.props)
        },
        onSelectionChanged: () => {},
        onLog: (msg, type) => editor.addLog(msg, type),
        getEditorState: () => ({ tiles: editor.placedTiles, objects: editor.placedObjects })
      }

      const editorScene = new EditorScene()

      const w = containerRef.current.offsetWidth || 800
      const h = Math.max((containerRef.current.offsetHeight || 600) - 40, 400)

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerId,
        width: w,
        height: h,
        physics: PhysicsConfig,
        backgroundColor: '#1a1a2e',
        scene: editorScene
      })

      gameRef.current = game

      game.events.once('ready', () => {
        if (!mounted) return
        const scene = game.scene.getScene('EditorScene')
        if (scene) {
          scene.callbacks = callbacks
          scene.getEditorState = callbacks.getEditorState
          sceneRef.current = scene
          scene.events.on('create', () => {
            scene.callbacks = callbacks
          })
        }
      })
    }

    initDirect()

    return () => {
      mounted = false
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    if (editor.selectedTile && scene.setActiveTile) scene.setActiveTile(editor.selectedTile)
  }, [editor.selectedTile])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    if (editor.selectedObject && scene.setActiveObject) scene.setActiveObject(editor.selectedObject)
  }, [editor.selectedObject])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    if (scene.setActiveLayer) scene.setActiveLayer(editor.selectedLayer)
  }, [editor.selectedLayer])

  useImperativeHandle(ref, () => ({
    setTool: (tool) => sceneRef.current?.setTool?.(tool),
    setActiveTile: (tile) => sceneRef.current?.setActiveTile?.(tile),
    setActiveObject: (obj) => sceneRef.current?.setActiveObject?.(obj),
    setActiveLayer: (layer) => sceneRef.current?.setActiveLayer?.(layer),
    exportMapData: () => sceneRef.current?.exportMapData?.(),
    importMapData: (data) => sceneRef.current?.importMapData?.(data),
    zoomIn: () => {
      const scene = sceneRef.current
      if (scene) {
        const z = scene.cameras.main.zoom
        scene.cameras.main.setZoom(Math.min(z + 0.25, 3))
      }
    },
    zoomOut: () => {
      const scene = sceneRef.current
      if (scene) {
        const z = scene.cameras.main.zoom
        scene.cameras.main.setZoom(Math.max(z - 0.25, 0.25))
      }
    },
    zoomReset: () => sceneRef.current?.cameras.main.setZoom(1)
  }))

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div id={containerId} style={{ width: '100%', height: 'calc(100% - 40px)' }} />
      <div className="zoom-controls">
        <button className="tool-btn" onClick={() => ref.current?.zoomIn()} title="Zoom In">+</button>
        <button className="tool-btn" onClick={() => ref.current?.zoomReset()} title="Reset Zoom">⊙</button>
        <button className="tool-btn" onClick={() => ref.current?.zoomOut()} title="Zoom Out">−</button>
      </div>
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', color: '#8892b0', fontSize: '11px', background: 'rgba(0,0,0,0.5)', padding: '3px 8px', borderRadius: '4px' }}>
        Space/Middle Mouse: Pan · Scroll: Zoom · 50×30 tiles
      </div>
    </div>
  )
})

export default LevelCanvas
