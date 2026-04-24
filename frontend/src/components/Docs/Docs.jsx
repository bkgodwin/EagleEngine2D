import React, { useState } from 'react'
import './Docs.css'

const SECTIONS = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'tilemap-guide', label: 'Tilemap Guide' },
  { id: 'objects-guide', label: 'Objects Guide' },
  { id: 'events-guide', label: 'Events Guide' },
  { id: 'multiplayer-guide', label: 'Multiplayer Guide' },
  { id: 'design-tips', label: 'Design Tips' }
]

const CONTENT = {
  'getting-started': (
    <div>
      <h2 className="docs-section-title">Getting Started</h2>
      <p className="docs-text">Welcome to Eagle Engine 2D — a browser-based 2D game creation tool. Build platformers, top-down adventures, and more with no coding required.</p>
      <h3 className="docs-subtitle">Creating Your First Project</h3>
      <p className="docs-text">1. Sign in or register for an account.<br />2. From the Dashboard, click <strong style={{color:'#e94560'}}>+ New Project</strong>.<br />3. Give your project a name and click <strong style={{color:'#e94560'}}>Create Project</strong>.<br />4. You'll be taken directly to the Editor.</p>
      <h3 className="docs-subtitle">The Editor Interface</h3>
      <p className="docs-text">The editor is divided into four main areas:</p>
      <pre className="docs-code">{`┌──────────┬───────────────────────┬──────────┐
│ Left     │   Level Canvas        │  Right   │
│ Panel    │   (your game world)   │  Panel   │
│ Tiles/   │                       │ Props/   │
│ Objects/ │                       │ Behaviors│
│ Layers/  │                       │          │
│ Design   │                       │          │
├──────────┴───────────────────────┴──────────┤
│               Debug Log                      │
└──────────────────────────────────────────────┘`}</pre>
      <h3 className="docs-subtitle">Placing Tiles</h3>
      <p className="docs-text">Select a tile from the Tiles panel, then click or drag on the canvas to place it. Use the Erase tool to remove tiles. Scroll to zoom, Space+drag or Middle Mouse to pan.</p>
      <h3 className="docs-subtitle">Saving & Auto-Save</h3>
      <p className="docs-text">Your project auto-saves every 30 seconds. You can also press <strong style={{color:'#e94560'}}>💾 Save</strong> in the toolbar at any time.</p>
    </div>
  ),
  'tilemap-guide': (
    <div>
      <h2 className="docs-section-title">Tilemap Guide</h2>
      <p className="docs-text">The level canvas is a 50×30 tile grid (1600×960 pixels). Each tile is 32×32 pixels.</p>
      <h3 className="docs-subtitle">Layers</h3>
      <p className="docs-text">Tiles are organized into four layers, rendered in this order:</p>
      <pre className="docs-code">{`1. Background  — Sky, walls, non-interactive scenery
2. Collision   — Solid tiles the player stands on
3. Decoration  — Foreground details, signs, crates
4. Objects     — Managed separately (enemy/player spawns)`}</pre>
      <h3 className="docs-subtitle">Tile Categories</h3>
      <p className="docs-text"><strong style={{color:'#e94560'}}>Terrain:</strong> Grass, Dirt, Sand, Stone, Metal, Sci-Fi Panel — all solid.<br /><strong style={{color:'#e94560'}}>Platforms:</strong> Solid, Semi-Solid, Moving.<br /><strong style={{color:'#e94560'}}>Hazards:</strong> Spikes, Lava, Electric Floor — deal damage on contact.<br /><strong style={{color:'#e94560'}}>Backgrounds:</strong> Non-solid decorative tiles.<br /><strong style={{color:'#e94560'}}>Decorative:</strong> Pipes, Signs, Crates, Lights.</p>
      <h3 className="docs-subtitle">Tips</h3>
      <p className="docs-text">• Hold left mouse button to paint tiles continuously.<br />• Use the search bar to quickly find tiles.<br />• Click a category header to collapse/expand it.</p>
    </div>
  ),
  'objects-guide': (
    <div>
      <h2 className="docs-section-title">Objects Guide</h2>
      <p className="docs-text">Objects are interactive entities placed in your level — players, enemies, traps, and items.</p>
      <h3 className="docs-subtitle">Player Objects</h3>
      <pre className="docs-code">{`side-scroller-player  — Use for platformer games
top-down-player       — Use for top-down games
Properties: speed, jumpForce, lives`}</pre>
      <h3 className="docs-subtitle">Enemy Types</h3>
      <pre className="docs-code">{`walker    — Patrols left/right on platforms
chaser    — Chases player when nearby
shooter   — Fires projectiles at player
flyer     — Moves in sine wave pattern
patrol    — Walks preset path
boss      — High HP, multi-phase`}</pre>
      <h3 className="docs-subtitle">Items</h3>
      <pre className="docs-code">{`collectible   — Adds points to score
health-pack   — Restores 1 life
key           — Required to open locked exits
exit          — Triggers level completion`}</pre>
      <h3 className="docs-subtitle">Placing Objects</h3>
      <p className="docs-text">Select an object from the Objects panel, then click on the canvas to place it. Each object has configurable default properties shown in the Properties panel.</p>
    </div>
  ),
  'events-guide': (
    <div>
      <h2 className="docs-section-title">Events Guide</h2>
      <p className="docs-text">The Behavior system lets you create conditional logic without writing code. Each rule has a <em>condition</em> (trigger) and an <em>action</em> (effect).</p>
      <h3 className="docs-subtitle">Conditions</h3>
      <pre className="docs-code">{`player_enters_zone   — Player steps into a trigger zone
timer                — After N seconds
enemy_defeated       — When an enemy is killed
object_interaction   — Player interacts with object`}</pre>
      <h3 className="docs-subtitle">Actions</h3>
      <pre className="docs-code">{`spawn_enemy       — Spawn a new enemy
activate_trap     — Trigger a trap
open_door         — Unlock/open a door
play_sound        — Play a sound effect
change_state      — Switch game state
complete_level    — Immediately win the level`}</pre>
      <h3 className="docs-subtitle">Example Rule</h3>
      <pre className="docs-code">{`WHEN: player_enters_zone  (param: "boss_room")
THEN: spawn_enemy         (param: "boss")`}</pre>
    </div>
  ),
  'multiplayer-guide': (
    <div>
      <h2 className="docs-section-title">Multiplayer Guide</h2>
      <p className="docs-text">Eagle Engine 2D supports multiple multiplayer modes configurable in the Design panel.</p>
      <h3 className="docs-subtitle">Modes</h3>
      <pre className="docs-code">{`singleplayer  — Classic solo play (default)
co-op         — Two players working together
pvp           — Players compete against each other`}</pre>
      <h3 className="docs-subtitle">Setting Up Co-op</h3>
      <p className="docs-text">1. In the Design panel, set Multiplayer to <strong style={{color:'#e94560'}}>co-op</strong>.<br />2. Place two player spawn points in the level.<br />3. Player 1 uses Arrow Keys, Player 2 uses WASD.<br />4. Publish the game and share the link.</p>
      <h3 className="docs-subtitle">PvP Mode</h3>
      <p className="docs-text">Players compete for score. Last player alive or highest score at the end wins. Use the Win Condition setting to configure victory conditions.</p>
    </div>
  ),
  'design-tips': (
    <div>
      <h2 className="docs-section-title">Design Tips</h2>
      <h3 className="docs-subtitle">Level Design Principles</h3>
      <p className="docs-text">• Start simple: teach mechanics before combining them.<br />• Use visual contrast to make interactive tiles obvious.<br />• Place checkpoints before difficult sections.<br />• Test your level after every significant change.</p>
      <h3 className="docs-subtitle">Performance Tips</h3>
      <p className="docs-text">• Avoid placing more than 500 enemies in a single level.<br />• Use background tiles sparingly — focus on collision layer.<br />• Keep your map focused — 50×30 is plenty for a fun level.</p>
      <h3 className="docs-subtitle">Recommended Settings</h3>
      <pre className="docs-code">{`Beginner level:
  Game Type:    side-scroller
  Camera:       follow
  Combat:       none
  Difficulty:   easy
  Win:          reach-exit

Advanced level:
  Game Type:    side-scroller
  Camera:       smooth-follow
  Combat:       melee
  Difficulty:   hard
  Win:          defeat-enemies`}</pre>
      <h3 className="docs-subtitle">Publishing</h3>
      <p className="docs-text">Once your level is ready, click <strong style={{color:'#e94560'}}>🚀 Publish</strong> in the toolbar. Add a title, description, and relevant tags so players can discover your game in the browser.</p>
    </div>
  )
}

export default function Docs() {
  const [activeSection, setActiveSection] = useState('getting-started')

  return (
    <div className="docs">
      <aside className="docs-sidebar">
        <div className="docs-nav-title">📚 Documentation</div>
        {SECTIONS.map(s => (
          <div
            key={s.id}
            className={`docs-nav-link ${activeSection === s.id ? 'active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </div>
        ))}
      </aside>
      <main className="docs-content">
        {CONTENT[activeSection]}
      </main>
    </div>
  )
}
