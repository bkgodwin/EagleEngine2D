import Phaser from 'phaser'
import { TILES, getTileById } from './TileRegistry.js'
import { OBJECTS, getObjectById } from './ObjectRegistry.js'
import { generateId } from '../utils/helpers.js'

const TILE_SIZE = 32
const MAP_W = 50
const MAP_H = 30

export default class EditorScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EditorScene' })
  }

  init(data) {
    this.callbacks = {
      onTilePlaced: data.onTilePlaced || (() => {}),
      onObjectPlaced: data.onObjectPlaced || (() => {}),
      onObjectRemoved: data.onObjectRemoved || (() => {}),
      onSelectionChanged: data.onSelectionChanged || (() => {}),
      onLog: data.onLog || (() => {})
    }
    this.getEditorState = data.getEditorState || (() => ({ tiles: {}, objects: [] }))
  }

  create() {
    this.placedTiles = {}
    this.placedObjects = []
    this.currentLayer = 'collision'
    this.activeTile = null
    this.activeObject = null
    this.tool = 'place'
    this.isPainting = false
    this.isPanning = false
    this.panStartX = 0
    this.panStartY = 0
    this.camStartX = 0
    this.camStartY = 0
    this.selectedInstanceId = null

    this.gridGraphics = this.add.graphics()
    this.tileGraphics = this.add.graphics()
    this.objectGraphics = this.add.graphics()
    this.cursorGraphics = this.add.graphics()
    this.selectionGraphics = this.add.graphics()
    this.objectTextGroup = this.add.group()

    this.cameras.main.setBounds(0, 0, MAP_W * TILE_SIZE, MAP_H * TILE_SIZE)
    this.cameras.main.setZoom(1)

    this.renderGrid()

    this.input.on('pointerdown', this.handlePointerDown, this)
    this.input.on('pointermove', this.handlePointerMove, this)
    this.input.on('pointerup', this.handlePointerUp, this)
    this.input.on('wheel', this.handleWheel, this)

    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.deleteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE)
    this.backspaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE)

    this.callbacks.onLog('Editor scene ready', 'info')
  }

  update() {
    const pointer = this.input.activePointer
    if (pointer.isDown) {
      const { tx, ty } = this.getPointerTile(pointer)
      this.highlightCursor(tx, ty)
    }

    // Delete selected object with Delete or Backspace
    if (this.selectedInstanceId) {
      if (Phaser.Input.Keyboard.JustDown(this.deleteKey) || Phaser.Input.Keyboard.JustDown(this.backspaceKey)) {
        this._deleteSelectedObject()
      }
    }
  }

  setTool(tool) {
    this.tool = tool
    if (tool !== 'select') {
      this._clearSelection()
    }
  }

  setActiveTile(tile) {
    this.activeTile = tile
    this.activeObject = null
  }

  setActiveObject(obj) {
    this.activeObject = obj
    this.activeTile = null
  }

  setActiveLayer(layer) {
    this.currentLayer = layer
  }

  getPointerTile(pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
    return {
      tx: Math.floor(worldPoint.x / TILE_SIZE),
      ty: Math.floor(worldPoint.y / TILE_SIZE)
    }
  }

  handlePointerDown(pointer) {
    if (pointer.middleButtonDown()) {
      this.isPanning = true
      this.panStartX = pointer.x
      this.panStartY = pointer.y
      this.camStartX = this.cameras.main.scrollX
      this.camStartY = this.cameras.main.scrollY
      return
    }

    if (this.spaceKey.isDown) {
      this.isPanning = true
      this.panStartX = pointer.x
      this.panStartY = pointer.y
      this.camStartX = this.cameras.main.scrollX
      this.camStartY = this.cameras.main.scrollY
      return
    }

    if (pointer.leftButtonDown()) {
      const { tx, ty } = this.getPointerTile(pointer)

      if (this.tool === 'select') {
        this._handleSelectClick(tx, ty)
        return
      }

      this.isPainting = true

      if (this.tool === 'place') {
        if (this.activeTile) {
          this.placeTileAt(tx, ty)
        } else if (this.activeObject) {
          this.placeObjectAt(tx, ty)
        }
      } else if (this.tool === 'erase') {
        this.eraseTileAt(tx, ty)
        this.eraseObjectAt(tx, ty)
      }
    }
  }

  handlePointerMove(pointer) {
    const { tx, ty } = this.getPointerTile(pointer)
    this.highlightCursor(tx, ty)

    if (this.isPanning) {
      const dx = (pointer.x - this.panStartX) / this.cameras.main.zoom
      const dy = (pointer.y - this.panStartY) / this.cameras.main.zoom
      this.cameras.main.scrollX = this.camStartX - dx
      this.cameras.main.scrollY = this.camStartY - dy
      return
    }

    if (this.isPainting && pointer.leftButtonDown()) {
      if (this.tool === 'place' && this.activeTile) {
        this.placeTileAt(tx, ty)
      } else if (this.tool === 'erase') {
        this.eraseTileAt(tx, ty)
      }
    }
  }

  handlePointerUp(pointer) {
    this.isPainting = false
    if (!pointer.middleButtonDown()) {
      this.isPanning = false
    }
  }

  handleWheel(pointer, gameObjects, deltaX, deltaY) {
    const zoom = this.cameras.main.zoom
    const newZoom = Phaser.Math.Clamp(zoom - deltaY * 0.001, 0.25, 3)
    this.cameras.main.setZoom(newZoom)
  }

  placeTileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return
    if (!this.activeTile) return

    if (!this.placedTiles[this.currentLayer]) {
      this.placedTiles[this.currentLayer] = {}
    }
    this.placedTiles[this.currentLayer][`${tx},${ty}`] = this.activeTile.id
    this.callbacks.onTilePlaced(this.currentLayer, tx, ty, this.activeTile.id)
    this.renderAllTiles()
  }

  eraseTileAt(tx, ty) {
    if (!this.placedTiles[this.currentLayer]) return
    delete this.placedTiles[this.currentLayer][`${tx},${ty}`]
    this.callbacks.onTilePlaced(this.currentLayer, tx, ty, null)
    this.renderAllTiles()
  }

  eraseObjectAt(tx, ty) {
    const wx = tx * TILE_SIZE + TILE_SIZE / 2
    const wy = ty * TILE_SIZE + TILE_SIZE / 2
    const idx = this.placedObjects.findIndex(o =>
      Math.abs(o.x - wx) <= TILE_SIZE / 2 && Math.abs(o.y - wy) <= TILE_SIZE / 2
    )
    if (idx > -1) {
      const obj = this.placedObjects[idx]
      this.placedObjects.splice(idx, 1)
      this.callbacks.onObjectRemoved(obj.id)
      this.renderObjects()
    }
  }

  placeObjectAt(tx, ty) {
    if (!this.activeObject) return
    const x = tx * TILE_SIZE + TILE_SIZE / 2
    const y = ty * TILE_SIZE + TILE_SIZE / 2
    const entry = {
      id: generateId(),
      objectId: this.activeObject.id,
      x,
      y,
      props: { ...this.activeObject.defaultProps }
    }
    this.placedObjects.push(entry)
    this.callbacks.onObjectPlaced(entry)
    this.renderObjects()
  }

  // ---------------------------------------------------------------------------
  // Select tool
  // ---------------------------------------------------------------------------

  _handleSelectClick(tx, ty) {
    const wx = tx * TILE_SIZE + TILE_SIZE / 2
    const wy = ty * TILE_SIZE + TILE_SIZE / 2

    // Find the object closest to the click within one tile
    let bestObj = null
    let bestDist = TILE_SIZE

    for (const obj of this.placedObjects) {
      const dist = Math.sqrt((obj.x - wx) ** 2 + (obj.y - wy) ** 2)
      if (dist < bestDist) {
        bestDist = dist
        bestObj = obj
      }
    }

    if (bestObj) {
      this.selectedInstanceId = bestObj.id
      this._renderSelectionHighlight(bestObj)
      this.callbacks.onSelectionChanged(bestObj)
      this.callbacks.onLog(`Selected: ${getObjectById(bestObj.objectId)?.name || bestObj.objectId} (press Delete to remove)`, 'info')
    } else {
      this._clearSelection()
      this.callbacks.onSelectionChanged(null)
    }
  }

  _renderSelectionHighlight(obj) {
    this.selectionGraphics.clear()
    if (!obj) return
    const px = obj.x - TILE_SIZE / 2
    const py = obj.y - TILE_SIZE / 2
    this.selectionGraphics.lineStyle(3, 0x00e676, 1)
    this.selectionGraphics.strokeRect(px - 2, py - 2, TILE_SIZE + 4, TILE_SIZE + 4)
    // Corner handles
    const hs = 6
    this.selectionGraphics.fillStyle(0x00e676, 1)
    this.selectionGraphics.fillRect(px - 4, py - 4, hs, hs)
    this.selectionGraphics.fillRect(px + TILE_SIZE - 2, py - 4, hs, hs)
    this.selectionGraphics.fillRect(px - 4, py + TILE_SIZE - 2, hs, hs)
    this.selectionGraphics.fillRect(px + TILE_SIZE - 2, py + TILE_SIZE - 2, hs, hs)
  }

  _clearSelection() {
    this.selectedInstanceId = null
    this.selectionGraphics.clear()
  }

  _deleteSelectedObject() {
    if (!this.selectedInstanceId) return
    const idx = this.placedObjects.findIndex(o => o.id === this.selectedInstanceId)
    if (idx > -1) {
      const obj = this.placedObjects[idx]
      this.placedObjects.splice(idx, 1)
      this.callbacks.onObjectRemoved(obj.id)
      this.callbacks.onLog(`Deleted: ${getObjectById(obj.objectId)?.name || obj.objectId}`, 'info')
      this.renderObjects()
    }
    this._clearSelection()
    this.callbacks.onSelectionChanged(null)
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  renderAllTiles() {
    this.tileGraphics.clear()
    const layerOrder = ['background', 'collision', 'decoration', 'objects']
    for (const layerId of layerOrder) {
      const layerTiles = this.placedTiles[layerId] || {}
      for (const [key, tileId] of Object.entries(layerTiles)) {
        const [tx, ty] = key.split(',').map(Number)
        const tile = getTileById(tileId)
        if (!tile) continue
        const color = parseInt(tile.color.replace('#', ''), 16)
        this.tileGraphics.fillStyle(color, 1)
        this.tileGraphics.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        this.tileGraphics.lineStyle(1, 0x2a2a4e, 0.5)
        this.tileGraphics.strokeRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      }
    }
  }

  renderGrid() {
    this.gridGraphics.clear()
    this.gridGraphics.lineStyle(1, 0x2a2a4e, 0.3)
    for (let x = 0; x <= MAP_W; x++) {
      this.gridGraphics.lineBetween(x * TILE_SIZE, 0, x * TILE_SIZE, MAP_H * TILE_SIZE)
    }
    for (let y = 0; y <= MAP_H; y++) {
      this.gridGraphics.lineBetween(0, y * TILE_SIZE, MAP_W * TILE_SIZE, y * TILE_SIZE)
    }
  }

  renderObjects() {
    this.objectGraphics.clear()
    this.objectTextGroup.clear(true, true)

    for (const obj of this.placedObjects) {
      const def = getObjectById(obj.objectId)
      if (!def) continue
      const color = parseInt(def.color.replace('#', ''), 16)
      const px = obj.x - TILE_SIZE / 2
      const py = obj.y - TILE_SIZE / 2
      this.objectGraphics.fillStyle(color, 0.8)
      this.objectGraphics.fillRect(px, py, TILE_SIZE, TILE_SIZE)
      this.objectGraphics.lineStyle(2, 0xffffff, 0.6)
      this.objectGraphics.strokeRect(px, py, TILE_SIZE, TILE_SIZE)
      const text = this.add.text(obj.x, obj.y, def.icon, {
        fontSize: '18px', align: 'center'
      }).setOrigin(0.5, 0.5)
      this.objectTextGroup.add(text)
    }

    // Re-render selection highlight if an object is selected
    if (this.selectedInstanceId) {
      const selObj = this.placedObjects.find(o => o.id === this.selectedInstanceId)
      if (selObj) {
        this._renderSelectionHighlight(selObj)
      } else {
        this._clearSelection()
      }
    }
  }

  highlightCursor(tx, ty) {
    this.cursorGraphics.clear()
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return
    this.cursorGraphics.fillStyle(0xffffff, 0.15)
    this.cursorGraphics.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE)
    this.cursorGraphics.lineStyle(2, 0xe94560, 0.8)
    this.cursorGraphics.strokeRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE)
  }

  exportMapData() {
    return {
      tiles: this.placedTiles,
      objects: this.placedObjects
    }
  }

  importMapData(data) {
    this.placedTiles = data.tiles || {}
    this.placedObjects = data.objects || []
    this._clearSelection()
    this.renderAllTiles()
    this.renderObjects()
  }
}
