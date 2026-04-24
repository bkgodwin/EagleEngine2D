import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function GameCard({ game }) {
  const navigate = useNavigate()
  const tags = Array.isArray(game.tags) ? game.tags : []
  const thumbColors = ['#533483 0%, #e94560 100%', '#1a6bdb 0%, #00bcd4 100%', '#4caf50 0%, #8bc34a 100%', '#ff9800 0%, #f44336 100%']
  const grad = thumbColors[game.id % thumbColors.length] || thumbColors[0]

  return (
    <div className="game-card" onClick={() => navigate(`/play/${game.id}`)}>
      <div
        className="game-thumbnail"
        style={{ background: game.thumbnail_url ? `url(${game.thumbnail_url}) center/cover` : `linear-gradient(135deg, ${grad})` }}
      >
        {!game.thumbnail_url && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
            🎮
          </div>
        )}
        {game.is_featured && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#e94560', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
            ⭐ Featured
          </div>
        )}
      </div>
      <div className="game-info">
        <div className="game-title">{game.title}</div>
        {game.description && <div className="game-desc">{game.description}</div>}
        {game.author_username && (
          <div style={{ color: '#8892b0', fontSize: '12px', marginBottom: '8px' }}>
            by {game.author_username}
          </div>
        )}
        {tags.length > 0 && (
          <div className="game-tags">
            {tags.slice(0, 4).map(tag => <span key={tag} className="tag">{tag}</span>)}
          </div>
        )}
        <div className="game-meta">
          <span>▶ {game.play_count || 0} plays</span>
          <button
            onClick={e => { e.stopPropagation(); /* navigate handled by card click */ }}
            style={{ background: '#e94560', border: 'none', color: '#fff', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
          >
            Play
          </button>
        </div>
      </div>
    </div>
  )
}
