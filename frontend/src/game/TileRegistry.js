export const TILE_CATEGORIES = [
  'Terrain', 'Platforms', 'Hazards', 'Backgrounds', 'Decorative'
]

export const TILES = [
  // Terrain
  { id: 'grass', name: 'Grass', category: 'Terrain', color: '#4a7c4e', solid: true, hazard: false },
  { id: 'dirt', name: 'Dirt', category: 'Terrain', color: '#8b6914', solid: true, hazard: false },
  { id: 'sand', name: 'Sand', category: 'Terrain', color: '#d4aa47', solid: true, hazard: false },
  { id: 'stone', name: 'Stone', category: 'Terrain', color: '#888888', solid: true, hazard: false },
  { id: 'metal', name: 'Metal', category: 'Terrain', color: '#555555', solid: true, hazard: false },
  { id: 'scifi-panel', name: 'Sci-Fi Panel', category: 'Terrain', color: '#00bcd4', solid: true, hazard: false },
  // Platforms
  { id: 'solid-platform', name: 'Solid Platform', category: 'Platforms', color: '#666666', solid: true, hazard: false },
  { id: 'semi-solid', name: 'Semi-Solid', category: 'Platforms', color: '#aaaaaa', solid: false, hazard: false },
  { id: 'moving-platform', name: 'Moving Platform', category: 'Platforms', color: '#1a6bdb', solid: true, hazard: false },
  // Hazards
  { id: 'spikes', name: 'Spikes', category: 'Hazards', color: '#e94560', solid: false, hazard: true },
  { id: 'lava', name: 'Lava', category: 'Hazards', color: '#ff6b00', solid: false, hazard: true },
  { id: 'electric-floor', name: 'Electric Floor', category: 'Hazards', color: '#ffeb3b', solid: false, hazard: true },
  // Backgrounds
  { id: 'sky', name: 'Sky', category: 'Backgrounds', color: '#87ceeb', solid: false, hazard: false },
  { id: 'industrial', name: 'Industrial', category: 'Backgrounds', color: '#333333', solid: false, hazard: false },
  { id: 'space', name: 'Space', category: 'Backgrounds', color: '#0a0a2e', solid: false, hazard: false },
  { id: 'dungeon', name: 'Dungeon', category: 'Backgrounds', color: '#2d2d2d', solid: false, hazard: false },
  // Decorative
  { id: 'pipe', name: 'Pipe', category: 'Decorative', color: '#2e7d32', solid: true, hazard: false },
  { id: 'sign', name: 'Sign', category: 'Decorative', color: '#fff9c4', solid: false, hazard: false },
  { id: 'crate', name: 'Crate', category: 'Decorative', color: '#795548', solid: true, hazard: false },
  { id: 'light', name: 'Light', category: 'Decorative', color: '#ffd54f', solid: false, hazard: false }
]

export function getTileById(id) {
  return TILES.find(t => t.id === id) || null
}
