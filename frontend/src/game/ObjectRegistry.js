export const OBJECT_CATEGORIES = [
  'Player', 'Enemies', 'Traps', 'Platforms', 'Triggers', 'Items'
]

export const OBJECTS = [
  // Player
  { id: 'side-scroller-player', name: 'Side-Scroller Player', category: 'Player', color: '#4caf50', icon: '🧍', defaultProps: { speed: 200, jumpForce: 400, lives: 3 } },
  { id: 'top-down-player', name: 'Top-Down Player', category: 'Player', color: '#2196f3', icon: '🧍', defaultProps: { speed: 180, lives: 3 } },
  // Enemies
  { id: 'walker', name: 'Walker', category: 'Enemies', color: '#f44336', icon: '👾', defaultProps: { speed: 60, hp: 1, damage: 1, patrolRange: 5 } },
  { id: 'chaser', name: 'Chaser', category: 'Enemies', color: '#e91e63', icon: '👺', defaultProps: { speed: 120, hp: 2, damage: 1, detectionRange: 8 } },
  { id: 'shooter', name: 'Shooter', category: 'Enemies', color: '#9c27b0', icon: '🔫', defaultProps: { speed: 0, hp: 2, damage: 1, fireRate: 2, range: 10 } },
  { id: 'flyer', name: 'Flyer', category: 'Enemies', color: '#ff9800', icon: '🦅', defaultProps: { speed: 100, hp: 1, damage: 1, amplitude: 2 } },
  { id: 'patrol', name: 'Patrol', category: 'Enemies', color: '#ff5722', icon: '🤖', defaultProps: { speed: 80, hp: 3, damage: 2, patrolRange: 8 } },
  { id: 'ambush', name: 'Ambush', category: 'Enemies', color: '#795548', icon: '👤', defaultProps: { speed: 150, hp: 2, damage: 2, triggerRange: 4 } },
  { id: 'shielded', name: 'Shielded', category: 'Enemies', color: '#607d8b', icon: '🛡️', defaultProps: { speed: 40, hp: 5, damage: 1, shieldBlock: 0.5 } },
  { id: 'boss', name: 'Boss', category: 'Enemies', color: '#b71c1c', icon: '💀', defaultProps: { speed: 80, hp: 20, damage: 3, phase2Hp: 10 } },
  // Traps
  { id: 'static-spikes', name: 'Static Spikes', category: 'Traps', color: '#e94560', icon: '⚡', defaultProps: { damage: 2 } },
  { id: 'moving-saw', name: 'Moving Saw', category: 'Traps', color: '#ff1744', icon: '🔪', defaultProps: { damage: 2, speed: 80, range: 5 } },
  { id: 'flame-jet', name: 'Flame Jet', category: 'Traps', color: '#ff6d00', icon: '🔥', defaultProps: { damage: 1, interval: 2, duration: 1 } },
  { id: 'falling-platform', name: 'Falling Platform', category: 'Traps', color: '#8d6e63', icon: '⬇️', defaultProps: { delay: 1.5 } },
  { id: 'crushing-block', name: 'Crushing Block', category: 'Traps', color: '#37474f', icon: '⬛', defaultProps: { damage: 5, speed: 200, triggerRange: 3 } },
  { id: 'laser-beam', name: 'Laser Beam', category: 'Traps', color: '#f50057', icon: '⭕', defaultProps: { damage: 2, interval: 3, duration: 1.5 } },
  { id: 'turret', name: 'Turret', category: 'Traps', color: '#546e7a', icon: '🎯', defaultProps: { damage: 1, fireRate: 1.5, range: 10 } },
  // Platforms
  { id: 'horizontal-platform', name: 'Horizontal Platform', category: 'Platforms', color: '#1565c0', icon: '↔️', defaultProps: { speed: 80, range: 5 } },
  { id: 'vertical-platform', name: 'Vertical Platform', category: 'Platforms', color: '#1565c0', icon: '↕️', defaultProps: { speed: 80, range: 4 } },
  { id: 'path-platform', name: 'Path Platform', category: 'Platforms', color: '#1565c0', icon: '🔄', defaultProps: { speed: 70, loopPath: true } },
  // Triggers
  { id: 'zone-trigger', name: 'Zone Trigger', category: 'Triggers', color: '#4caf50', icon: '🔲', defaultProps: { width: 2, height: 2, triggerOnce: true } },
  { id: 'timer-trigger', name: 'Timer Trigger', category: 'Triggers', color: '#ff9800', icon: '⏱️', defaultProps: { seconds: 5, repeat: false } },
  // Items
  { id: 'collectible', name: 'Collectible', category: 'Items', color: '#ffc107', icon: '⭐', defaultProps: { value: 100 } },
  { id: 'health-pack', name: 'Health Pack', category: 'Items', color: '#4caf50', icon: '💊', defaultProps: { heal: 1 } },
  { id: 'key', name: 'Key', category: 'Items', color: '#ffd700', icon: '🔑', defaultProps: { keyId: 'key1' } },
  { id: 'exit', name: 'Exit', category: 'Items', color: '#00bcd4', icon: '🚪', defaultProps: { requiresKey: false, keyId: '' } }
]

export function getObjectById(id) {
  return OBJECTS.find(o => o.id === id) || null
}
