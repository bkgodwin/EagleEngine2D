import Phaser from 'phaser'
import { getTileById } from './TileRegistry.js'
import { getObjectById } from './ObjectRegistry.js'

const TILE_SIZE = 32

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  init(data) {
    this.mapData = data.mapData || { tiles: {}, objects: [] }
    this.gameConfig = data.gameConfig || {}
  }

  preload() {}

  create() {
    this.score = 0
    this.lives = 3
    this.collected = 0
    this.enemiesDefeated = 0
    this.gameOver = false
    this.levelComplete = false

    this.tileRects = []
    this.hazardRects = []

    this.staticGroup = this.physics.add.staticGroup()
    this.hazardGroup = this.physics.add.staticGroup()

    this._buildTiles()
    this._createPlayer()
    this._createEnemies()
    this._createItems()
    this._setupCamera()
    this._setupUI()
    this._setupInput()
  }

  _buildTiles() {
    const layerOrder = ['background', 'collision', 'decoration']
    for (const layerId of layerOrder) {
      const layerTiles = this.mapData.tiles?.[layerId] || {}
      for (const [key, tileId] of Object.entries(layerTiles)) {
        const [tx, ty] = key.split(',').map(Number)
        const tileData = getTileById(tileId)
        if (!tileData) continue
        const px = tx * TILE_SIZE + TILE_SIZE / 2
        const py = ty * TILE_SIZE + TILE_SIZE / 2
        const color = parseInt(tileData.color.replace('#', ''), 16)
        const rect = this.add.rectangle(px, py, TILE_SIZE, TILE_SIZE, color)
        if (tileData.solid) {
          this.physics.add.existing(rect, true)
          this.staticGroup.add(rect)
        }
        if (tileData.hazard) {
          this.physics.add.existing(rect, true)
          this.hazardGroup.add(rect)
        }
      }
    }
  }

  _createPlayer() {
    const playerObj = this.mapData.objects?.find(o => o.objectId === 'side-scroller-player' || o.objectId === 'top-down-player')
    const startX = playerObj ? playerObj.x : 64
    const startY = playerObj ? playerObj.y : 64
    this.player = this.add.rectangle(startX, startY, 24, 32, 0x4caf50)
    this.physics.add.existing(this.player)
    this.player.body.setCollideWorldBounds(true)
    this.player.body.setMaxVelocityX(300)
    this.physics.add.collider(this.player, this.staticGroup)
    this.physics.add.overlap(this.player, this.hazardGroup, () => this._playerHit())
    this.playerSpeed = playerObj?.props?.speed || 200
    this.playerJump = playerObj?.props?.jumpForce || 400
    this.lives = playerObj?.props?.lives || 3
  }

  _createEnemies() {
    this.enemies = []
    const enemyIds = ['walker', 'chaser', 'patrol', 'flyer']
    for (const obj of (this.mapData.objects || [])) {
      if (!enemyIds.includes(obj.objectId)) continue
      const def = getObjectById(obj.objectId)
      if (!def) continue
      const color = parseInt(def.color.replace('#', ''), 16)
      const enemy = this.add.rectangle(obj.x, obj.y, 24, 32, color)
      this.physics.add.existing(enemy)
      enemy.body.setCollideWorldBounds(true)
      enemy.patrolDir = 1
      enemy.patrolRange = (obj.props?.patrolRange || 5) * TILE_SIZE
      enemy.patrolStart = obj.x
      enemy.hp = obj.props?.hp || 1
      enemy.damage = obj.props?.damage || 1
      enemy.speed = obj.props?.speed || 60
      enemy.def = def
      this.physics.add.collider(enemy, this.staticGroup)
      this.physics.add.overlap(this.player, enemy, () => this._playerHit())
      this.enemies.push(enemy)
    }
  }

  _createItems() {
    this.items = []
    const itemIds = ['collectible', 'health-pack', 'key', 'exit']
    for (const obj of (this.mapData.objects || [])) {
      if (!itemIds.includes(obj.objectId)) continue
      const def = getObjectById(obj.objectId)
      if (!def) continue
      const color = parseInt(def.color.replace('#', ''), 16)
      const item = this.add.rectangle(obj.x, obj.y, 20, 20, color)
      this.physics.add.existing(item, true)
      item.objectId = obj.objectId
      item.props = obj.props || {}
      this.physics.add.overlap(this.player, item, () => this._collectItem(item))
      this.items.push(item)
    }
  }

  _setupCamera() {
    const mapW = 50 * TILE_SIZE
    const mapH = 30 * TILE_SIZE
    this.cameras.main.setBounds(0, 0, mapW, mapH)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
  }

  _setupUI() {
    this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
      fontSize: '18px', fill: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 8, y: 4 }
    }).setScrollFactor(0)
    this.livesText = this.add.text(16, 48, `Lives: ${this.lives}`, {
      fontSize: '18px', fill: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 8, y: 4 }
    }).setScrollFactor(0)
  }

  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    }
  }

  _playerHit() {
    if (this.gameOver || this.playerInvincible) return
    this.lives--
    this.livesText.setText(`Lives: ${this.lives}`)
    this.playerInvincible = true
    this.time.delayedCall(1500, () => { this.playerInvincible = false })
    if (this.lives <= 0) {
      this.gameOver = true
      this._showMessage('GAME OVER')
    }
  }

  _collectItem(item) {
    if (!item.active) return
    item.destroy()
    const idx = this.items.indexOf(item)
    if (idx > -1) this.items.splice(idx, 1)
    if (item.objectId === 'collectible') {
      this.score += item.props?.value || 100
      this.scoreText.setText(`Score: ${this.score}`)
    } else if (item.objectId === 'health-pack') {
      this.lives = Math.min(this.lives + 1, 5)
      this.livesText.setText(`Lives: ${this.lives}`)
    } else if (item.objectId === 'exit') {
      this.levelComplete = true
      this._showMessage('LEVEL COMPLETE!')
    }
    this._checkWinCondition()
  }

  _checkWinCondition() {
    const wc = this.gameConfig.winCondition || 'reach-exit'
    if (wc === 'collect-items') {
      const remaining = this.items.filter(i => i.objectId === 'collectible' && i.active).length
      if (remaining === 0) {
        this.levelComplete = true
        this._showMessage('LEVEL COMPLETE!')
      }
    }
  }

  _showMessage(msg) {
    const cx = this.cameras.main.width / 2
    const cy = this.cameras.main.height / 2
    this.add.text(cx, cy, msg, {
      fontSize: '48px', fill: '#e94560', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0)
  }

  update() {
    if (this.gameOver || this.levelComplete) return

    const onGround = this.player.body.blocked.down
    const left = this.cursors.left.isDown || this.wasd.left.isDown
    const right = this.cursors.right.isDown || this.wasd.right.isDown
    const jump = this.cursors.up.isDown || this.wasd.up.isDown || this.cursors.space?.isDown

    if (left) {
      this.player.body.setVelocityX(-this.playerSpeed)
    } else if (right) {
      this.player.body.setVelocityX(this.playerSpeed)
    } else {
      this.player.body.setVelocityX(0)
    }

    if (jump && onGround) {
      this.player.body.setVelocityY(-this.playerJump)
    }

    for (const enemy of this.enemies) {
      if (!enemy.active) continue
      enemy.body.setVelocityX(enemy.speed * enemy.patrolDir)
      const distFromStart = enemy.x - enemy.patrolStart
      if (Math.abs(distFromStart) >= enemy.patrolRange || enemy.body.blocked.left || enemy.body.blocked.right) {
        enemy.patrolDir *= -1
      }
    }
  }
}
