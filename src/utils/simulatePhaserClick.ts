import Phaser from 'phaser';

/**
 * Simula un clic en Phaser en las coordenadas de canvas (Phaser coords).
 * @param game Instancia de Phaser.Game
 * @param phaserX Coordenada X en sistema Phaser
 * @param phaserY Coordenada Y en sistema Phaser
 */
export function simulatePhaserClick(game: Phaser.Game, phaserX: number, phaserY: number) {
  const scene = game.scene.getScene("CoinScene") || game.scene.scenes[0];
  if (!scene) return;

  // Prepara el puntero de Phaser
  const pointer = scene.input.activePointer;
  pointer.x = phaserX;
  pointer.y = phaserY;
  pointer.isDown = true;

  // Hit-test contra el grupo de monedas
  const coins = (scene as any).coins.getChildren();
  const hits: any[] = scene.input.hitTestPointer(pointer, coins);
  if (hits.length) {
    scene.collectCoin(hits[0]);
    console.log(`✅ Phaser: recolectada coin en (${phaserX.toFixed(0)}, ${phaserY.toFixed(0)})`);
  } else {
    console.log(`⚠️ Phaser: no hay coin en (${phaserX.toFixed(0)}, ${phaserY.toFixed(0)})`);
  }

  // Limpia el estado “down” para no mantener pulsado
  pointer.isDown = false;
}
