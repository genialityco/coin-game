let activeGame: Phaser.Game | null = null;

export function setActivePhaserGame(game: Phaser.Game) {
  activeGame = game;
}

export function getActivePhaserGame(): Phaser.Game | null {
  return activeGame;
}
