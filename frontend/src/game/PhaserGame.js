import Phaser from 'phaser'

export function createPhaserGame(containerId, scenes, config = {}) {
  const gameConfig = {
    type: Phaser.AUTO,
    parent: containerId,
    ...config,
    scene: scenes
  }
  return new Phaser.Game(gameConfig)
}

export function destroyPhaserGame(game) {
  if (game) {
    game.destroy(true)
  }
}
