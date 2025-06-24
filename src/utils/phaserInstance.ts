// utils/phaserInstance.ts
let gameInstance: Phaser.Game | null = null;

export function setActivePhaserGame(game: Phaser.Game) {
  gameInstance = game;
}

export function getActivePhaserGame(): Phaser.Game | null {
  return gameInstance;
}