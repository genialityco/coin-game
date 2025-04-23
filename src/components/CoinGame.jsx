import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const TOTAL_COINS = 20;      // número total de monedas a generar
const COIN_SCALE  = 0.1;    // escala de las monedas

// Define tus tipos de moneda y sus pesos relativos
const COIN_TYPES = [
  {
    key:    'coin1',
    asset:  '/assets/MONEDA_01.png',
    weight: 3,               // aparecerá 3 veces más que coin2
    label:  'Moneda 1'
  },
  {
    key:    'coin2',
    asset:  '/assets/MONEDA_02.png',
    weight: 1,
    label:  'Moneda 2'
  }
];

export default function CoinGame() {
  const gameContainer = useRef(null);

  useEffect(() => {
    const container = gameContainer.current;
    let side = container.clientWidth;

    // Suma total de pesos
    const totalWeight = COIN_TYPES.reduce((sum, ct) => sum + ct.weight, 0);

    class CoinScene extends Phaser.Scene {
      constructor() {
        super({ key: 'CoinScene' });
        this.score = {};
      }

      preload() {
        COIN_TYPES.forEach(ct => {
          this.load.image(ct.key, ct.asset);
        });
      }

      create() {
        this.scoreTexts = {};
        COIN_TYPES.forEach((ct, idx) => {
          this.score[ct.key] = 0;
          this.scoreTexts[ct.key] = this.add.text(
            10,
            10 + idx * 30,
            `${ct.label}: 0`,
            { font: '20px Arial', fill: '#fff' }
          );
        });

        // Grupo de monedas sin física, solo para manejo 
        this.coins = this.add.group();

        // Crea monedas que caen en bucle
        for (let i = 0; i < TOTAL_COINS; i++) {
          const rnd = Phaser.Math.Between(1, totalWeight);
          let acc = 0;
          const chosen = COIN_TYPES.find(ct => {
            acc += ct.weight;
            return rnd <= acc;
          });

          // Obtiene dimensiones de la textura
          const texture = this.textures.get(chosen.key).getSourceImage();
          const wTx = texture.width  * COIN_SCALE;
          const hTx = texture.height * COIN_SCALE;

          // Posiciones de inicicio y fin
          const x = Phaser.Math.Between(wTx / 2, this.scale.width - wTx / 2);
          const startY = Phaser.Math.Between(-hTx, 0);
          const endY = this.scale.height + hTx / 2;

          // Crea la moneda
          const coin = this.add.image(x, startY, chosen.key)
            .setScale(COIN_SCALE)
            .setInteractive();
          this.coins.add(coin);

          // Caida continua
          this.tweens.add({
            targets: coin,
            y: endY,
            duration: Phaser.Math.Between(3000, 6000),
            ease: 'Linear',
            repeat: -1,
            repeatDelay: Phaser.Math.Between(0, 1000)
          });
        }

        // Manejo de clic en moneda
        this.input.on('gameobjectdown', (_, coin) => {
          const type = coin.texture.key;
          coin.disableInteractive();
          coin.setVisible(false);
          this.score[type]++;
          this.scoreTexts[type].setText(
            `${COIN_TYPES.find(ct => ct.key === type).label}: ${this.score[type]}`
          );
        });
      }
    }

    const config = {
      type:        Phaser.AUTO,
      parent:      container,
      transparent: true,
      scene:       CoinScene,
      scale: {
        width:  side,
        height: side,
        mode:   Phaser.Scale.NONE
      }
    };

    const game = new Phaser.Game(config);

    // Ajuste al redimensionar
    const onResize = () => {
      side = container.clientWidth;
      game.scale.resize(side, side);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      game.destroy(true);
    };
  }, []);

  return <div ref={gameContainer} className="coin-container" />;
}
