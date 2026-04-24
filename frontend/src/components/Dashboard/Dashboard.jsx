import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext.jsx'
import { listProjects, createProject, deleteProject } from '../../api/projects.js'
import { getMyGames, deleteGame, listPublicGames } from '../../api/games.js'
import Button from '../Common/Button.jsx'
import Modal from '../Common/Modal.jsx'
import LoadingSpinner from '../Common/LoadingSpinner.jsx'
import { formatDate } from '../../utils/helpers.js'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [myGames, setMyGames] = useState([])
  const [featuredGames, setFeaturedGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [p, g, f] = await Promise.allSettled([
        listProjects(),
        getMyGames(),
        listPublicGames({ featured: true, limit: 6 })
      ])
      if (p.status === 'fulfilled') setProjects(p.value || [])
      if (g.status === 'fulfilled') setMyGames(g.value || [])
      if (f.status === 'fulfilled') setFeaturedGames(f.value || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    try {
      const project = await createProject({ name: newName, description: newDesc, data: {}, is_public: false })
      setProjects(prev => [project, ...prev])
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
      navigate(`/editor/${project.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return
    try {
      await deleteProject(id)
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert('Failed to delete project')
    }
  }

  const handleDeleteGame = async (id) => {
    if (!window.confirm('Unpublish this game?')) return
    try {
      await deleteGame(id)
      setMyGames(prev => prev.filter(g => g.id !== id))
    } catch (err) {
      alert('Failed to delete game')
    }
  }

  if (loading) return <div className="dashboard"><LoadingSpinner /></div>

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome back, {user?.username}! 👋</h1>
        <p style={{ color: '#8892b0', marginTop: '8px' }}>Build, play, and share your games</p>
      </div>

      {/* Projects Section */}
      <div style={{ marginBottom: '40px' }}>
        <div className="section-header">
          <h2 className="section-title">My Projects</h2>
          <Button size="sm" onClick={() => setShowCreate(true)}>+ New Project</Button>
        </div>
        {projects.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎮</div>
            <p>No projects yet. Create your first game!</p>
            <Button style={{ marginTop: '16px' }} onClick={() => setShowCreate(true)}>Create Project</Button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <div key={project.id} className="project-card">
                <div className="project-card-title">{project.name}</div>
                <div className="project-card-desc">{project.description || 'No description'}</div>
                <div style={{ color: '#8892b0', fontSize: '12px', marginBottom: '12px' }}>
                  Created {formatDate(project.created_at)}
                </div>
                <div className="project-card-footer">
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/editor/${project.id}`)}>
                    ✏️ Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(project.id)}>
                    🗑️ Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Games Section */}
      {myGames.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <div className="section-header">
            <h2 className="section-title">My Published Games</h2>
          </div>
          <div className="projects-grid">
            {myGames.map(game => (
              <div key={game.id} className="project-card">
                <div className="project-card-title">{game.title}</div>
                <div className="project-card-desc">{game.description || 'No description'}</div>
                <div style={{ color: '#8892b0', fontSize: '12px', marginBottom: '12px' }}>
                  ▶ {game.play_count || 0} plays · Published {formatDate(game.created_at)}
                </div>
                <div className="project-card-footer">
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/play/${game.id}`)}>
                    ▶ Play
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteGame(game.id)}>
                    🗑️
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Games */}
      {featuredGames.length > 0 && (
        <div>
          <div className="section-header">
            <h2 className="section-title">Featured Games</h2>
            <Button size="sm" variant="ghost" onClick={() => navigate('/browser')}>View All →</Button>
          </div>
          <div className="projects-grid">
            {featuredGames.map(game => (
              <div key={game.id} className="project-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/play/${game.id}`)}>
                <div className="project-card-title">{game.title}</div>
                <div className="project-card-desc">{game.description}</div>
                <div style={{ color: '#8892b0', fontSize: '12px' }}>
                  ▶ {game.play_count || 0} plays
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setError('') }}
        title="Create New Project"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowCreate(false); setError('') }}>Cancel</Button>
            <Button loading={creating} onClick={handleCreate}>Create Project</Button>
          </>
        }
      >
        {error && <div style={{ color: '#e94560', marginBottom: '12px', fontSize: '14px' }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: '#8892b0', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Project Name *</label>
            <input
              style={{ width: '100%', background: '#0f3460', border: '1px solid #2a2a4e', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="My Awesome Game"
              autoFocus
            />
          </div>
          <div>
            <label style={{ color: '#8892b0', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Description</label>
            <textarea
              style={{ width: '100%', background: '#0f3460', border: '1px solid #2a2a4e', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', minHeight: '80px' }}
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="A brief description..."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
