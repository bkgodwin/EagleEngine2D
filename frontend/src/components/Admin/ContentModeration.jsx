import React, { useState, useEffect } from 'react'
import { listAllGames, moderateGame, deleteAdminGame } from '../../api/admin.js'
import Button from '../Common/Button.jsx'
import LoadingSpinner from '../Common/LoadingSpinner.jsx'
import { formatDate } from '../../utils/helpers.js'

export default function ContentModeration() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    listAllGames()
      .then(data => setGames(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleFeature = async (game) => {
    try {
      const updated = await moderateGame(game.id, { is_featured: !game.is_featured })
      setGames(prev => prev.map(g => g.id === game.id ? { ...g, is_featured: updated.is_featured } : g))
    } catch (err) {
      alert('Failed to update game')
    }
  }

  const handleHide = async (game) => {
    try {
      const updated = await moderateGame(game.id, { is_hidden: !game.is_hidden })
      setGames(prev => prev.map(g => g.id === game.id ? { ...g, is_hidden: updated.is_hidden } : g))
    } catch (err) {
      alert('Failed to update game')
    }
  }

  const handleDelete = async (game) => {
    if (!window.confirm(`Delete game "${game.title}"? This cannot be undone.`)) return
    try {
      await deleteAdminGame(game.id)
      setGames(prev => prev.filter(g => g.id !== game.id))
    } catch (err) {
      alert('Failed to delete game')
    }
  }

  const filtered = games.filter(g =>
    g.title?.toLowerCase().includes(search.toLowerCase()) ||
    g.author_username?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <input
        style={{ width: '100%', maxWidth: '300px', background: '#0f3460', border: '1px solid #2a2a4e', color: '#fff', padding: '8px 12px', borderRadius: '6px', marginBottom: '16px', fontFamily: 'inherit' }}
        placeholder="Search games..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th><th>Author</th><th>Plays</th>
              <th>Featured</th><th>Hidden</th><th>Published</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => (
              <tr key={g.id}>
                <td style={{ color: '#fff' }}>{g.title}</td>
                <td style={{ color: '#8892b0' }}>{g.author_username || '—'}</td>
                <td style={{ color: '#8892b0' }}>{g.play_count || 0}</td>
                <td><span style={{ color: g.is_featured ? '#e94560' : '#8892b0' }}>{g.is_featured ? '⭐' : '—'}</span></td>
                <td><span style={{ color: g.is_hidden ? '#ffeb3b' : '#8892b0' }}>{g.is_hidden ? '🙈' : '👁'}</span></td>
                <td style={{ color: '#8892b0', fontSize: '12px' }}>{formatDate(g.created_at)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <Button size="sm" variant={g.is_featured ? 'ghost' : 'secondary'} onClick={() => handleFeature(g)}>
                      {g.is_featured ? 'Unfeature' : 'Feature'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleHide(g)}>
                      {g.is_hidden ? 'Show' : 'Hide'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(g)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
