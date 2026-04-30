import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPublicGame } from '../../api/games.js'
import LoadingSpinner from '../Common/LoadingSpinner.jsx'
import './GamePlayer.css'

export default function GamePlayer({ gameData: gameProp, inline = false }) {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const gameRef = useRef(null)
  const [game, setGame] = useState(gameProp || null)
  const [loading, setLoading] = useState(!gameProp && !!gameId)
  const [error, setError] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const containerId = `game-player-canvas-${gameId || 'inline'}`

  useEffect(() => {
    if (!gameProp && gameId) {
      getPublicGame(gameId)
        .then(data => { setGame(data); setLoading(false) })
        .catch(err => { setError(err.message); setLoading(false) })
    }
  }, [gameId, gameProp])

  useEffect(() => {
    if (!game) return
    let phaserGame = null
    let mounted = true

    const initGame = async () => {
      try {
        const Phaser = (await import('phaser')).default
        const GameScene = (await import('../../game/GameScene.js')).default
        const PhysicsConfig = (await import('../../game/PhysicsConfig.js')).default

        if (!mounted || !containerRef.current) return

        const mapData = game.game_data || {}
        const gameConfig = mapData.designConfig || {}

        // Instantiate the scene class and inject data via an init override so
        // Phaser calls the real GameScene prototype methods with correct `this`.
        const gameScene = new GameScene()
        const origInit = GameScene.prototype.init
        gameScene.init = function (data) {
          origInit.call(this, { mapData, gameConfig })
        }

        phaserGame = new Phaser.Game({
          type: Phaser.AUTO,
          parent: containerId,
          width: containerRef.current.offsetWidth || 800,
          height: containerRef.current.offsetHeight || 500,
          physics: PhysicsConfig,
          backgroundColor: '#0a0a2e',
          scene: gameScene
        })

        gameRef.current = phaserGame
      } catch (err) {
        if (mounted) setError('Failed to start game: ' + err.message)
      }
    }

    initGame()

    return () => {
      mounted = false
      if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null }
    }
  }, [game, containerId])

  const toggleFullscreen = () => {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setFullscreen(f => !f)
  }

  if (loading) return <div className="game-player"><LoadingSpinner /></div>
  if (error) return <div className="game-player" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#e94560' }}>Error: {error}</div></div>

  if (inline) {
    return (
      <div ref={containerRef} id={containerId} style={{ width: '100%', height: '100%', background: '#0a0a2e' }} />
    )
  }

  return (
    <div className="game-player">
      <div className="player-header">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #2a2a4e', color: '#8892b0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
          ← Back
        </button>
        <div className="player-title">{game?.title || 'Game Player'}</div>
        <button onClick={toggleFullscreen} style={{ background: 'none', border: '1px solid #2a2a4e', color: '#8892b0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', marginLeft: 'auto' }}>
          {fullscreen ? '⊡ Exit Fullscreen' : '⛶ Fullscreen'}
        </button>
      </div>
      <div className="game-container">
        <div ref={containerRef} id={containerId} style={{ width: '800px', height: '500px', background: '#0a0a2e' }} />
      </div>
      {game?.description && (
        <div style={{ padding: '16px 24px', color: '#8892b0', maxWidth: '800px', margin: '0 auto' }}>
          {game.description}
        </div>
      )}
    </div>
  )
}
