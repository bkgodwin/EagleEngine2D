import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { listPublicGames } from '../../api/games.js'
import { debounce } from '../../utils/helpers.js'
import GameCard from './GameCard.jsx'
import LoadingSpinner from '../Common/LoadingSpinner.jsx'
import './GameBrowser.css'

export default function GameBrowser() {
  const navigate = useNavigate()
  const [games, setGames] = useState([])
  const [featuredGames, setFeaturedGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const PAGE_SIZE = 12

  useEffect(() => {
    listPublicGames({ featured: true, limit: 6 })
      .then(data => setFeaturedGames(Array.isArray(data) ? data : []))
      .catch(console.error)
    loadGames(0, '', '')
  }, [])

  const loadGames = async (pageNum, search, tag) => {
    setLoading(pageNum === 0)
    setLoadingMore(pageNum > 0)
    try {
      const params = { skip: pageNum * PAGE_SIZE, limit: PAGE_SIZE }
      if (search) params.search = search
      if (tag) params.tag = tag
      const data = await listPublicGames(params)
      const list = Array.isArray(data) ? data : []
      if (pageNum === 0) setGames(list)
      else setGames(prev => [...prev, ...list])
      setHasMore(list.length === PAGE_SIZE)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const debouncedSearch = useCallback(
    debounce((search, tag) => {
      setPage(0)
      loadGames(0, search, tag)
    }, 500),
    []
  )

  const handleSearch = (val) => {
    setSearchQuery(val)
    debouncedSearch(val, tagFilter)
  }

  const handleTag = (val) => {
    setTagFilter(val)
    debouncedSearch(searchQuery, val)
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadGames(nextPage, searchQuery, tagFilter)
  }

  return (
    <div className="game-browser">
      <div className="browser-header">
        <h1 className="browser-title">🕹️ Game Browser</h1>
        <p style={{ color: '#8892b0', marginTop: '8px' }}>Discover and play games made with Eagle Engine 2D</p>
      </div>
      <div className="search-bar">
        <input className="search-input" placeholder="Search games..." value={searchQuery} onChange={e => handleSearch(e.target.value)} />
        <input className="search-input" style={{ maxWidth: '200px' }} placeholder="Filter by tag..." value={tagFilter} onChange={e => handleTag(e.target.value)} />
      </div>

      {featuredGames.length > 0 && !searchQuery && !tagFilter && (
        <div className="featured-section">
          <h2 style={{ color: '#e94560', fontSize: '20px', marginBottom: '16px' }}>⭐ Featured Games</h2>
          <div className="featured-scroll">
            {featuredGames.map(game => (
              <div key={game.id} style={{ flexShrink: 0, width: '260px' }}>
                <GameCard game={game} />
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '16px' }}>
        {searchQuery || tagFilter ? `Search Results` : 'All Games'}
      </h2>

      {loading ? (
        <LoadingSpinner />
      ) : games.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#8892b0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
          <p>No games found. Be the first to publish!</p>
        </div>
      ) : (
        <>
          <div className="games-grid">
            {games.map(game => <GameCard key={game.id} game={game} />)}
          </div>
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{ background: '#1a1a2e', border: '1px solid #2a2a4e', color: '#fff', padding: '12px 32px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
