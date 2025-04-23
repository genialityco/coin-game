// src/components/CoinGame.jsx
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const TOTAL_COINS = 20;      // número total de monedas a generar
const COIN_SCALE  = 0.1;    // tamaño de las monedas

// Define tus tipos de moneda y sus pesos relativos
const COIN_TYPES = [
  {
    key:    'coin1',
    asset:  '/assets/MONEDA_01.png',
    weight: 3,               // aparecerá 3 veces más que coin2
    label:  'Moneda 1'       // para mostrar en el texto
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
        // carga dinámica de cada moneda
        COIN_TYPES.forEach(ct => {
          this.load.image(ct.key, ct.asset);
        });
      }

      create() {
        // Inicializa contadores y textos
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

        // Grupo de monedas
        this.coins = this.physics.add.staticGroup();

        // Para cada moneda…
        for (let i = 0; i < TOTAL_COINS; i++) {
          // elige tipo según peso
          const rnd = Phaser.Math.Between(1, totalWeight);
          let acc = 0;
          const chosen = COIN_TYPES.find(ct => {
            acc += ct.weight;
            return rnd <= acc;
          });

          // dimensiones para margen
          const texture = this.textures.get(chosen.key).getSourceImage();
          const wTx = texture.width  * COIN_SCALE;
          const hTx = texture.height * COIN_SCALE;

          // posición aleatoria dentro del cuadrado
          const x = Phaser.Math.Between(wTx / 2, this.scale.width - wTx / 2);
          const y = Phaser.Math.Between(
            hTx / 2 + COIN_SCALE * 20,
            this.scale.height - hTx / 2 - COIN_SCALE * 20
          );

          const coin = this.coins.create(x, y, chosen.key).setScale(COIN_SCALE);
          coin.setInteractive();

          // tween para flotar
          this.tweens.add({
            targets: coin,
            y:       y - 20,
            duration: 800,
            yoyo:    true,
            repeat:  -1,
            ease:    'Sine.easeInOut'
          });
        }

        // al hacer clic/tap en una moneda…
        this.input.on('gameobjectdown', (_, coin) => {
          const type = coin.texture.key;
          coin.disableBody(true, true);
          this.score[type]++;
          this.scoreTexts[type].setText(
            `${COIN_TYPES.find(ct => ct.key === type).label}: ${this.score[type]}`
          );
        });
      }
    }

    // Configuración Phaser
    const config = {
      type:        Phaser.AUTO,
      parent:      container,
      transparent: true,
      physics:     { default: 'arcade' },
      scene:       CoinScene,
      scale: {
        width:  side,
        height: side,
        mode:   Phaser.Scale.NONE
      }
    };

    const game = new Phaser.Game(config);

    // Manejo de resize
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
