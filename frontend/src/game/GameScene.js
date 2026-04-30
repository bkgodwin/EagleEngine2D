import Phaser from 'phaser'
import { getTileById } from './TileRegistry.js'
import { getObjectById } from './ObjectRegistry.js'

const TILE_SIZE = 32
const PLAYER_IDS = ['side-scroller-player', 'top-down-player']

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
    this.enemiesDefeated = 0
    this.gameOver = false
    this.levelComplete = false
    this.lastDirection = { x: 1, y: 0 }
    this.projectiles = []
    this.enemyProjectiles = []
    this.movingPlatforms = []
    this.trapObjects = []
    this.lastAttackTime = 0

    this.isTopDown = this.gameConfig?.gameType === 'top-down'

    // Disable gravity for top-down games
    if (this.isTopDown) {
      this.physics.world.gravity.y = 0
    }

    this.staticGroup = this.physics.add.staticGroup()
    this.hazardGroup = this.physics.add.staticGroup()

    this._buildTiles()
    this._createPlayer()
    this._createEnemies()
    this._createItems()
    this._createMovingPlatforms()
    this._createTraps()
    this._setupCamera()
    this._setupUI()
    this._setupInput()
  }

  // ---------------------------------------------------------------------------
  // Map building
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Player
  // ---------------------------------------------------------------------------

  _createPlayer() {
    // Collect all player spawn objects; pick a random one if multiple exist
    const playerObjs = (this.mapData.objects || []).filter(o => PLAYER_IDS.includes(o.objectId))
    let spawnObj = null
    if (playerObjs.length > 0) {
      spawnObj = playerObjs[Math.floor(Math.random() * playerObjs.length)]
    }

    const startX = spawnObj ? spawnObj.x : 64
    const startY = spawnObj ? spawnObj.y : 64

    const color = this.isTopDown ? 0x2196f3 : 0x4caf50
    this.player = this.add.rectangle(startX, startY, 24, 32, color)
    this.physics.add.existing(this.player)
    this.player.body.setCollideWorldBounds(true)
    this.player.body.setMaxVelocityX(400)
    this.player.body.setMaxVelocityY(600)

    if (this.isTopDown) {
      this.player.body.setAllowGravity(false)
    }

    this.physics.add.collider(this.player, this.staticGroup)
    this.physics.add.overlap(this.player, this.hazardGroup, () => this._playerHit())

    this.playerSpeed = spawnObj?.props?.speed || (this.isTopDown ? 180 : 200)
    this.playerJump = spawnObj?.props?.jumpForce || 400
    this.lives = spawnObj?.props?.lives || 3
  }

  // ---------------------------------------------------------------------------
  // Enemies
  // ---------------------------------------------------------------------------

  _createEnemies() {
    this.enemies = []
    const enemyIds = ['walker', 'chaser', 'patrol', 'flyer', 'shooter', 'ambush', 'shielded', 'boss']
    for (const obj of (this.mapData.objects || [])) {
      if (!enemyIds.includes(obj.objectId)) continue
      const def = getObjectById(obj.objectId)
      if (!def) continue
      const color = parseInt(def.color.replace('#', ''), 16)
      const enemy = this.add.rectangle(obj.x, obj.y, 24, 32, color)
      this.physics.add.existing(enemy)
      enemy.body.setCollideWorldBounds(true)
      enemy.objectId = obj.objectId
      enemy.patrolDir = 1
      enemy.patrolRange = (obj.props?.patrolRange || 5) * TILE_SIZE
      enemy.patrolStart = obj.x
      enemy.hp = obj.props?.hp || 1
      enemy.maxHp = enemy.hp
      enemy.damage = obj.props?.damage || 1
      enemy.speed = obj.props?.speed || 60
      enemy.detectionRange = (obj.props?.detectionRange || 8) * TILE_SIZE
      enemy.fireRate = obj.props?.fireRate || 2
      enemy.lastFireTime = 0
      enemy.shieldBlock = obj.props?.shieldBlock || 0
      enemy.sinePhase = Math.random() * Math.PI * 2
      enemy.sineAmplitude = (obj.props?.amplitude || 2) * TILE_SIZE
      enemy.startY = obj.y
      enemy.isPhase2 = false
      enemy.phase2Hp = obj.props?.phase2Hp || Math.ceil(enemy.hp / 2)

      // Flyers ignore gravity
      if (obj.objectId === 'flyer') {
        enemy.body.setAllowGravity(false)
      }

      this.physics.add.collider(enemy, this.staticGroup)
      this.physics.add.overlap(this.player, enemy, () => this._playerHit())
      this.enemies.push(enemy)
    }
  }

  // ---------------------------------------------------------------------------
  // Items / collectibles
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Moving platforms
  // ---------------------------------------------------------------------------

  _createMovingPlatforms() {
    const platformIds = ['horizontal-platform', 'vertical-platform', 'path-platform']
    for (const obj of (this.mapData.objects || [])) {
      if (!platformIds.includes(obj.objectId)) continue
      const plat = this.add.rectangle(obj.x, obj.y, TILE_SIZE * 2, TILE_SIZE / 2, 0x1565c0)
      this.physics.add.existing(plat, false)
      plat.body.setAllowGravity(false)
      plat.body.setImmovable(true)
      plat.objectId = obj.objectId
      plat.moveDir = 1
      plat.startX = obj.x
      plat.startY = obj.y
      plat.speed = obj.props?.speed || 80
      plat.range = (obj.props?.range || 5) * TILE_SIZE
      this.physics.add.collider(this.player, plat)
      this.movingPlatforms.push(plat)
    }
  }

  // ---------------------------------------------------------------------------
  // Traps
  // ---------------------------------------------------------------------------

  _createTraps() {
    const trapIds = ['static-spikes', 'moving-saw', 'flame-jet', 'laser-beam', 'turret', 'crushing-block', 'falling-platform']
    for (const obj of (this.mapData.objects || [])) {
      if (!trapIds.includes(obj.objectId)) continue
      const def = getObjectById(obj.objectId)
      if (!def) continue
      const color = parseInt(def.color.replace('#', ''), 16)

      if (obj.objectId === 'static-spikes') {
        const trap = this.add.rectangle(obj.x, obj.y, TILE_SIZE, TILE_SIZE / 2, color)
        this.physics.add.existing(trap, true)
        this.physics.add.overlap(this.player, trap, () => this._playerHit())
        this.trapObjects.push({ rect: trap, type: 'static' })

      } else if (obj.objectId === 'moving-saw') {
        const saw = this.add.rectangle(obj.x, obj.y, 20, 20, color)
        this.physics.add.existing(saw, false)
        saw.body.setAllowGravity(false)
        saw.body.setImmovable(true)
        saw.moveDir = 1
        saw.startX = obj.x
        saw.speed = obj.props?.speed || 80
        saw.range = (obj.props?.range || 5) * TILE_SIZE
        this.physics.add.overlap(this.player, saw, () => this._playerHit())
        this.trapObjects.push({ rect: saw, type: 'moving-saw' })

      } else if (obj.objectId === 'flame-jet' || obj.objectId === 'laser-beam') {
        const interval = (obj.props?.interval || 3) * 1000
        const duration = (obj.props?.duration || 1) * 1000
        const trap = this.add.rectangle(obj.x, obj.y, TILE_SIZE, TILE_SIZE, color)
        this.physics.add.existing(trap, true)
        trap.setVisible(false)
        trap.isActive = false
        // Only damage when the trap is visually active
        this.physics.add.overlap(this.player, trap, () => {
          if (trap.isActive) this._playerHit()
        })
        const activateTrap = () => {
          trap.isActive = true
          trap.setVisible(true)
          this.time.delayedCall(duration, () => {
            trap.isActive = false
            trap.setVisible(false)
          })
        }
        // Start with a random offset so not all traps fire in sync
        this.time.delayedCall(Math.random() * interval, () => {
          activateTrap()
          this.time.addEvent({ delay: interval, callback: activateTrap, loop: true })
        })
        this.trapObjects.push({ rect: trap, type: 'periodic' })

      } else if (obj.objectId === 'turret') {
        const turret = this.add.rectangle(obj.x, obj.y, TILE_SIZE, TILE_SIZE, color)
        this.physics.add.existing(turret, true)
        turret.fireRate = obj.props?.fireRate || 1.5
        turret.range = (obj.props?.range || 10) * TILE_SIZE
        turret.damage = obj.props?.damage || 1
        turret.lastFireTime = 0
        this.trapObjects.push({ rect: turret, type: 'turret' })
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Camera, UI, Input
  // ---------------------------------------------------------------------------

  _setupCamera() {
    const mapW = 50 * TILE_SIZE
    const mapH = 30 * TILE_SIZE
    this.cameras.main.setBounds(0, 0, mapW, mapH)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
  }

  _setupUI() {
    this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
      fontSize: '18px', fill: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 8, y: 4 }
    }).setScrollFactor(0).setDepth(10)
    this.livesText = this.add.text(16, 48, `Lives: ${this.lives}`, {
      fontSize: '18px', fill: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 8, y: 4 }
    }).setScrollFactor(0).setDepth(10)

    const combat = this.gameConfig.combat || 'none'
    if (combat !== 'none') {
      this.add.text(16, this.cameras.main.height - 32,
        combat === 'projectile' ? 'SPACE: Shoot' : combat === 'melee' ? 'SPACE: Attack' : 'SPACE: Attack/Shoot',
        { fontSize: '13px', fill: '#8892b0', backgroundColor: 'rgba(0,0,0,0.4)', padding: { x: 6, y: 3 } }
      ).setScrollFactor(0).setDepth(10)
    }
  }

  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    }
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
  }

  // ---------------------------------------------------------------------------
  // Player damage / death
  // ---------------------------------------------------------------------------

  _playerHit() {
    if (this.gameOver || this.playerInvincible) return
    this.lives--
    this.livesText.setText(`Lives: ${this.lives}`)
    this.playerInvincible = true
    // Brief flash effect
    this.tweens.add({ targets: this.player, alpha: 0, duration: 100, yoyo: true, repeat: 4,
      onComplete: () => { this.player.setAlpha(1) }
    })
    this.time.delayedCall(1500, () => { this.playerInvincible = false })
    if (this.lives <= 0) {
      this.gameOver = true
      this._showMessage('GAME OVER', '#e94560')
    }
  }

  // ---------------------------------------------------------------------------
  // Attack
  // ---------------------------------------------------------------------------

  _playerAttack() {
    const combat = this.gameConfig.combat || 'none'
    if (combat === 'none') return
    const now = this.time.now
    if (now - this.lastAttackTime < 400) return // 400ms cooldown
    this.lastAttackTime = now

    if (combat === 'melee' || combat === 'hybrid') this._meleeAttack()
    if (combat === 'projectile' || combat === 'hybrid') this._fireProjectile()
  }

  _meleeAttack() {
    const range = 36
    const cx = this.player.x + this.lastDirection.x * range
    const cy = this.player.y + this.lastDirection.y * range

    // Visual flash
    const flash = this.add.rectangle(cx, cy, 28, 28, 0xffffff, 0.7)
    this.time.delayedCall(150, () => { if (flash.active) flash.destroy() })

    for (const enemy of [...this.enemies]) {
      if (!enemy.active) continue
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, cx, cy)
      if (dist < range + 16) {
        this._damageEnemy(enemy, 1)
      }
    }
  }

  _fireProjectile() {
    const dx = this.lastDirection.x
    const dy = this.lastDirection.y
    if (dx === 0 && dy === 0) return

    const proj = this.add.rectangle(this.player.x, this.player.y, 8, 8, 0xffff00)
    proj.setDepth(5)
    this.physics.add.existing(proj)
    proj.body.setAllowGravity(false)
    proj.body.setVelocity(dx * 480, dy * 480)
    proj.spawnTime = this.time.now
    proj.lifespan = 1800
    proj.fromPlayer = true

    for (const enemy of this.enemies) {
      if (!enemy.active) continue
      this.physics.add.overlap(proj, enemy, () => {
        if (proj.active && enemy.active) {
          this._damageEnemy(enemy, 1)
          this._destroyProjectile(proj)
        }
      })
    }

    // Destroy on hitting solid tiles
    this.physics.add.collider(proj, this.staticGroup, () => {
      this._destroyProjectile(proj)
    })

    this.projectiles.push(proj)
  }

  _destroyProjectile(proj) {
    if (!proj.active) return
    proj.destroy()
  }

  // ---------------------------------------------------------------------------
  // Enemy AI & projectiles
  // ---------------------------------------------------------------------------

  _damageEnemy(enemy, amount) {
    if (!enemy.active) return
    const actualDamage = Math.max(1, amount - (enemy.shieldBlock || 0))
    enemy.hp -= actualDamage
    this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true })

    // Boss phase 2 trigger
    if (enemy.objectId === 'boss' && !enemy.isPhase2 && enemy.hp <= enemy.phase2Hp) {
      enemy.isPhase2 = true
      enemy.speed *= 1.5
      enemy.setFillStyle(0xff0000)
    }

    if (enemy.hp <= 0) {
      this.enemiesDefeated++
      this.score += (enemy.objectId === 'boss' ? 500 : 50)
      this.scoreText.setText(`Score: ${this.score}`)
      enemy.destroy()
      this.enemies.splice(this.enemies.indexOf(enemy), 1)
      this._checkWinCondition()
    }
  }

  _updateEnemies() {
    const now = this.time.now
    for (const enemy of [...this.enemies]) {
      if (!enemy.active) continue

      switch (enemy.objectId) {
        case 'walker':
        case 'patrol': {
          enemy.body.setVelocityX(enemy.speed * enemy.patrolDir)
          const dist = enemy.x - enemy.patrolStart
          if (Math.abs(dist) >= enemy.patrolRange || enemy.body.blocked.left || enemy.body.blocked.right) {
            enemy.patrolDir *= -1
          }
          break
        }

        case 'chaser': {
          const dx = this.player.x - enemy.x
          const dy = this.player.y - enemy.y
          const playerDist = Math.sqrt(dx * dx + dy * dy)
          if (playerDist < enemy.detectionRange) {
            const speed = enemy.speed
            enemy.body.setVelocityX(dx > 0 ? speed : -speed)
            if (this.isTopDown) {
              enemy.body.setVelocityY(dy > 0 ? speed : -speed)
            }
          } else {
            enemy.body.setVelocityX(0)
            if (this.isTopDown) enemy.body.setVelocityY(0)
          }
          break
        }

        case 'ambush': {
          const adx = this.player.x - enemy.x
          const ady = this.player.y - enemy.y
          const adist = Math.sqrt(adx * adx + ady * ady)
          if (adist < enemy.detectionRange) {
            enemy.body.setVelocityX(adx > 0 ? enemy.speed : -enemy.speed)
            if (this.isTopDown) {
              enemy.body.setVelocityY(ady > 0 ? enemy.speed : -enemy.speed)
            }
          } else {
            enemy.body.setVelocityX(0)
            if (this.isTopDown) enemy.body.setVelocityY(0)
          }
          break
        }

        case 'flyer': {
          const t = now * 0.002
          const sineY = enemy.startY + Math.sin(t + enemy.sinePhase) * enemy.sineAmplitude
          enemy.body.setVelocityX(enemy.speed * enemy.patrolDir)
          const dist2 = enemy.x - enemy.patrolStart
          if (Math.abs(dist2) >= enemy.patrolRange || enemy.body.blocked.left || enemy.body.blocked.right) {
            enemy.patrolDir *= -1
          }
          // Smoothly drift toward sine position
          const yDiff = sineY - enemy.y
          enemy.body.setVelocityY(Phaser.Math.Clamp(yDiff * 3, -120, 120))
          break
        }

        case 'shooter': {
          // Stay still; fire at player on interval
          enemy.body.setVelocityX(0)
          enemy.body.setVelocityY(0)
          const shootDx = this.player.x - enemy.x
          const shootDy = this.player.y - enemy.y
          const shootDist = Math.sqrt(shootDx * shootDx + shootDy * shootDy)
          const fireInterval = (1000 / enemy.fireRate)
          if (shootDist < (enemy.detectionRange || TILE_SIZE * 12) && now - enemy.lastFireTime > fireInterval) {
            enemy.lastFireTime = now
            this._fireEnemyProjectile(enemy, shootDx / shootDist, shootDy / shootDist)
          }
          break
        }

        case 'boss': {
          const bdx = this.player.x - enemy.x
          const bdy = this.player.y - enemy.y
          enemy.body.setVelocityX(bdx > 0 ? enemy.speed : -enemy.speed)
          if (this.isTopDown) {
            enemy.body.setVelocityY(bdy > 0 ? enemy.speed : -enemy.speed)
          }
          // Boss fires in phase 2
          if (enemy.isPhase2 && now - enemy.lastFireTime > 1500) {
            enemy.lastFireTime = now
            const blen = Math.sqrt(bdx * bdx + bdy * bdy) || 1
            this._fireEnemyProjectile(enemy, bdx / blen, bdy / blen)
          }
          break
        }

        case 'shielded': {
          enemy.body.setVelocityX(enemy.speed * enemy.patrolDir)
          const sdist = enemy.x - enemy.patrolStart
          if (Math.abs(sdist) >= enemy.patrolRange || enemy.body.blocked.left || enemy.body.blocked.right) {
            enemy.patrolDir *= -1
          }
          break
        }

        default:
          break
      }
    }
  }

  _fireEnemyProjectile(enemy, dx, dy) {
    const proj = this.add.rectangle(enemy.x, enemy.y, 7, 7, 0xff4444)
    proj.setDepth(5)
    this.physics.add.existing(proj)
    proj.body.setAllowGravity(false)
    proj.body.setVelocity(dx * 300, dy * 300)
    proj.spawnTime = this.time.now
    proj.lifespan = 2000

    this.physics.add.overlap(proj, this.player, () => {
      if (proj.active) {
        this._playerHit()
        this._destroyProjectile(proj)
      }
    })
    this.physics.add.collider(proj, this.staticGroup, () => {
      this._destroyProjectile(proj)
    })

    this.enemyProjectiles.push(proj)
  }

  // ---------------------------------------------------------------------------
  // Moving platforms & traps update
  // ---------------------------------------------------------------------------

  _updateMovingPlatforms() {
    for (const plat of this.movingPlatforms) {
      if (!plat.active) continue
      if (plat.objectId === 'horizontal-platform' || plat.objectId === 'path-platform') {
        const dist = plat.x - plat.startX
        if (Math.abs(dist) >= plat.range) plat.moveDir *= -1
        plat.body.setVelocityX(plat.speed * plat.moveDir)
        plat.body.setVelocityY(0)
      } else if (plat.objectId === 'vertical-platform') {
        const dist = plat.y - plat.startY
        if (Math.abs(dist) >= plat.range) plat.moveDir *= -1
        plat.body.setVelocityX(0)
        plat.body.setVelocityY(plat.speed * plat.moveDir)
      }
    }
  }

  _updateTraps() {
    for (const trap of this.trapObjects) {
      if (!trap.rect.active) continue
      if (trap.type === 'moving-saw') {
        const saw = trap.rect
        const dist = saw.x - saw.startX
        if (Math.abs(dist) >= saw.range) saw.moveDir *= -1
        saw.body.setVelocityX(saw.speed * saw.moveDir)
      } else if (trap.type === 'turret') {
        const turret = trap.rect
        const now = this.time.now
        const dx = this.player.x - turret.x
        const dy = this.player.y - turret.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const fireInterval = 1000 / (turret.fireRate || 1.5)
        if (dist < turret.range && now - turret.lastFireTime > fireInterval) {
          turret.lastFireTime = now
          this._fireEnemyProjectile(turret, dx / dist, dy / dist)
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Items / win condition
  // ---------------------------------------------------------------------------

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
      this._showMessage('LEVEL COMPLETE! 🎉', '#00e676')
    }
    this._checkWinCondition()
  }

  _checkWinCondition() {
    if (this.levelComplete || this.gameOver) return
    const wc = this.gameConfig.winCondition || 'reach-exit'
    if (wc === 'collect-items') {
      const remaining = this.items.filter(i => i.objectId === 'collectible' && i.active).length
      if (remaining === 0) {
        this.levelComplete = true
        this._showMessage('LEVEL COMPLETE! 🎉', '#00e676')
      }
    } else if (wc === 'defeat-enemies') {
      if (this.enemies.filter(e => e.active).length === 0) {
        this.levelComplete = true
        this._showMessage('LEVEL COMPLETE! 🎉', '#00e676')
      }
    }
  }

  _showMessage(msg, color = '#e94560') {
    const cx = this.cameras.main.width / 2
    const cy = this.cameras.main.height / 2
    this.add.text(cx, cy, msg, {
      fontSize: '42px', fill: color, stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20)
  }

  // ---------------------------------------------------------------------------
  // Main update loop
  // ---------------------------------------------------------------------------

  update() {
    if (this.gameOver || this.levelComplete) return

    if (this.isTopDown) {
      this._updateTopDown()
    } else {
      this._updateSideScroller()
    }

    // Attack
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this._playerAttack()
    }

    this._updateMovingPlatforms()
    this._updateTraps()
    this._updateEnemies()
    this._cullProjectiles()

    // Carry player on moving platform
    if (!this.isTopDown && this.player.body.blocked.down) {
      this._applyPlatformCarry()
    }
  }

  _updateSideScroller() {
    const left = this.cursors.left.isDown || this.wasd.left.isDown
    const right = this.cursors.right.isDown || this.wasd.right.isDown
    const jump = (this.cursors.up.isDown || this.wasd.up.isDown) && this.player.body.blocked.down

    if (left) {
      this.player.body.setVelocityX(-this.playerSpeed)
      this.lastDirection = { x: -1, y: 0 }
    } else if (right) {
      this.player.body.setVelocityX(this.playerSpeed)
      this.lastDirection = { x: 1, y: 0 }
    } else {
      this.player.body.setVelocityX(0)
    }

    if (jump) {
      this.player.body.setVelocityY(-this.playerJump)
    }
  }

  _updateTopDown() {
    const left = this.cursors.left.isDown || this.wasd.left.isDown
    const right = this.cursors.right.isDown || this.wasd.right.isDown
    const up = this.cursors.up.isDown || this.wasd.up.isDown
    const down = this.wasd.down.isDown || this.cursors.down.isDown

    let vx = 0
    let vy = 0
    if (left) vx = -this.playerSpeed
    else if (right) vx = this.playerSpeed
    if (up) vy = -this.playerSpeed
    else if (down) vy = this.playerSpeed

    this.player.body.setVelocity(vx, vy)

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy)
      this.lastDirection = { x: vx / len, y: vy / len }
    }
  }

  _applyPlatformCarry() {
    for (const plat of this.movingPlatforms) {
      if (!plat.active) continue
      const pLeft = this.player.x - 12
      const pRight = this.player.x + 12
      const platLeft = plat.x - TILE_SIZE
      const platRight = plat.x + TILE_SIZE
      const pBottom = this.player.y + 16
      const platTop = plat.y - TILE_SIZE / 4

      if (pRight > platLeft && pLeft < platRight && Math.abs(pBottom - platTop) < 8) {
        const dt = this.game.loop.delta / 1000
        const newX = this.player.body.x + plat.body.velocity.x * dt
        this.player.body.setPosition(newX, this.player.body.y)
      }
    }
  }

  _cullProjectiles() {
    const now = this.time.now
    this.projectiles = this.projectiles.filter(p => {
      if (!p.active) return false
      if (now - p.spawnTime > p.lifespan) { p.destroy(); return false }
      return true
    })
    this.enemyProjectiles = this.enemyProjectiles.filter(p => {
      if (!p.active) return false
      if (now - p.spawnTime > p.lifespan) { p.destroy(); return false }
      return true
    })
  }
}
