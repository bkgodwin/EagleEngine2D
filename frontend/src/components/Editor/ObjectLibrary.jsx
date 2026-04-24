import React, { useState } from 'react'
import { useEditor } from '../../store/EditorContext.jsx'
import { OBJECTS, OBJECT_CATEGORIES } from '../../game/ObjectRegistry.js'

export default function ObjectLibrary() {
  const { selectedObject, selectObject } = useEditor()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(
    Object.fromEntries(OBJECT_CATEGORIES.map(c => [c, true]))
  )

  const filtered = OBJECTS.filter(obj =>
    obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    obj.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const grouped = OBJECT_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = filtered.filter(o => o.category === cat)
    return acc
  }, {})

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  return (
    <div>
      <input
        className="search-input"
        placeholder="Search objects..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      {OBJECT_CATEGORIES.map(cat => {
        const objs = grouped[cat] || []
        if (objs.length === 0) return null
        return (
          <div key={cat}>
            <div className="category-header" onClick={() => toggleCategory(cat)}>
              <span>{cat}</span>
              <span>{expandedCategories[cat] ? '▾' : '▸'}</span>
            </div>
            {expandedCategories[cat] && (
              <div className="tile-grid">
                {objs.map(obj => (
                  <div
                    key={obj.id}
                    className={`tile-item ${selectedObject?.id === obj.id ? 'selected' : ''}`}
                    onClick={() => selectObject(obj)}
                    title={obj.name}
                  >
                    <div className="tile-color-box" style={{ backgroundColor: obj.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      {obj.icon}
                    </div>
                    <div className="tile-name">{obj.name}</div>
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
