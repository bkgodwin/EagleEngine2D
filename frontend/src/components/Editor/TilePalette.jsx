import React, { useState } from 'react'
import { useEditor } from '../../store/EditorContext.jsx'
import { TILES, TILE_CATEGORIES } from '../../game/TileRegistry.js'

export default function TilePalette() {
  const { selectedTile, selectTile } = useEditor()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(
    Object.fromEntries(TILE_CATEGORIES.map(c => [c, true]))
  )

  const filtered = TILES.filter(tile =>
    tile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tile.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const grouped = TILE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = filtered.filter(t => t.category === cat)
    return acc
  }, {})

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  return (
    <div>
      <input
        className="search-input"
        placeholder="Search tiles..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      {TILE_CATEGORIES.map(cat => {
        const tiles = grouped[cat] || []
        if (tiles.length === 0) return null
        return (
          <div key={cat}>
            <div className="category-header" onClick={() => toggleCategory(cat)}>
              <span>{cat}</span>
              <span>{expandedCategories[cat] ? '▾' : '▸'}</span>
            </div>
            {expandedCategories[cat] && (
              <div className="tile-grid">
                {tiles.map(tile => (
                  <div
                    key={tile.id}
                    className={`tile-item ${selectedTile?.id === tile.id ? 'selected' : ''}`}
                    onClick={() => selectTile(tile)}
                    title={tile.name}
                  >
                    <div className="tile-color-box" style={{ backgroundColor: tile.color }} />
                    <div className="tile-name">{tile.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
