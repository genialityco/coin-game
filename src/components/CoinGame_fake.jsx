// pages/CoinGame.tsx
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Phaser from 'phaser';
import { useTouchPoints } from '../hooks/useTouchPoints';
import '../index.css';
import { TouchDebugOverlay } from '../components/TouchDebugOverlay';

const TOTAL_COINS = 30;
const COIN_SCALE = 0.1;
const GAME_TIME = 20;
const COIN_TYPES = [
  { key: 'coin1', asset: '/assets/SIMBOLO_BETPLAY.png', weight: 3, label: 'Moneda 1', points: 20 },
  { key: 'coin2', asset: '/assets/LOGO-BETPLAY.png', weight: 3, label: 'Moneda 2', points: 30 },
  { key: 'betplay', asset: '/assets/MONEDA_02.png', weight: 1, label: 'Logo Betplay', points: 50 },
];

export default function CoinGame() {
  const gameContainer = useRef(null);
  const [started, setStarted] = useState(false);
  const [showPremios, setShowPremios] = useState(true);
  const touchPoints = useTouchPoints();
  const sceneRef = useRef({ touchPoints });

  useEffect(() => {
    sceneRef.current.touchPoints = touchPoints;
  }, [touchPoints]);

  useEffect(() => {
    if (!started) return;
    const container = gameContainer.current;
    const side = Math.min(container.clientWidth, container.clientHeight);

    class CoinScene extends Phaser.Scene {
      constructor() {
        super('CoinScene');
      }

      preload() {
        COIN_TYPES.forEach((ct) => this.load.image(ct.key, ct.asset));
        this.load.image('legales', '/assets/LEGALES.png');
        this.load.image('header', '/assets/FRASE_COPY.png');
      }

      create() {
        this.timeLeft = GAME_TIME;
        this.counts = {};
        this.scores = {};
        this.timerEvent = null;

        this.headerImg = this.add.image(this.scale.width / 2, 50, 'header').setOrigin(0.5, 0).setScale(0.25).setDepth(4);
        this.footerImg = this.add.image(this.scale.width / 2, this.scale.height, 'legales').setOrigin(0.5, 1).setScale(0.3).setDepth(4);
        this.timerText = this.add.text(this.scale.width - 10, 10, `00:${GAME_TIME}`, {
          fontFamily: 'Arial', fontSize: '28px', fontWeight: 'bold', color: '#ffffff'
        }).setOrigin(1, -1).setDepth(3);

        const panelWidth = 190, panelX = this.scale.width - panelWidth - 10, panelY = 80, panelHeight = COIN_TYPES.length * 40 + 20;
        const gfx = this.add.graphics().setDepth(1);
        gfx.fillStyle(0x000000, 0.6).fillRect(panelX, panelY, panelWidth, panelHeight);

        const contentCenterX = panelX + panelWidth / 2;
        this.texts = {};
        COIN_TYPES.forEach((ct, idx) => {
          this.counts[ct.key] = 0;
          this.scores[ct.key] = 0;
          const yRow = panelY + 10 + idx * 40;
          const iconScale = ct.key === 'coin2' ? 0.1 : 0.045;
          this.add.image(contentCenterX - 50, yRow + 15, ct.key).setScale(iconScale).setDepth(2).setOrigin(0.5);
          this.add.text(contentCenterX, yRow, 'x', { font: 'bold 20px Arial', fill: '#fff' }).setDepth(2).setOrigin(0.3, 0);
          this.texts[ct.key] = this.add.text(contentCenterX + 20, yRow, '0  |  0', {
            font: 'bold 20px Arial', fill: '#fff'
          }).setDepth(2).setOrigin(0.1, 0);
        });

        this.coins = this.add.group();
        const totalWeight = COIN_TYPES.reduce((s, ct) => s + ct.weight, 0);
        for (let i = 0; i < TOTAL_COINS; i++) this.spawnCoin(totalWeight);

        this.input.on('gameobjectdown', (_, coin) => this.collectCoin(coin));

        this.touchMarkers = [];
        this.touchDebugText = this.add.text(10, 10, '', {
          font: '14px Courier',
          fill: '#ff0000',
          align: 'left'
        }).setDepth(11).setScrollFactor(0);

        this.timerEvent = this.time.addEvent({
          delay: 1000,
          repeat: GAME_TIME - 1,
          callback: () => {
            this.timeLeft--;
            this.timerText.setText(`00:${this.timeLeft.toString().padStart(2, '0')}`);
            if (this.timeLeft === 0) this.endGame();
          }
        });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
      }

      update() {
        const points = sceneRef.current.touchPoints;
        if (!points || !points.length) return;

        const w = this.scale.width;
        const h = this.scale.height;

        this.touchMarkers.forEach((marker) => marker.destroy());
        this.touchMarkers = [];

        let debugLines = [];

        points.forEach((pt) => {
          if (!pt.is_touching) return;
          const x = w - (pt['2d_x_px'] / 640) * w;
          const y = (pt['2d_y_px'] / 480) * h;

          const marker = this.add.circle(x, y, 8, 0xff0000).setDepth(10);
          this.touchMarkers.push(marker);

          debugLines.push(`${pt.id}: (${Math.round(x)}, ${Math.round(y)})`);

          this.coins.children.iterate((coin) => {
            if (!coin || !coin.active) return;
            const bounds = coin.getBounds();
            if (Phaser.Geom.Rectangle.Contains(bounds, x, y)) {
              this.collectCoin(coin);
            }
          });
        });

        this.touchDebugText.setText(debugLines.join('\n'));
      }

      spawnCoin(totalWeight) {
        const rnd = Phaser.Math.Between(1, totalWeight);
        let acc = 0;
        const chosen = COIN_TYPES.find((ct) => (acc += ct.weight) >= rnd);

        const tex = this.textures.get(chosen.key).getSourceImage();
        const wTx = tex.width * COIN_SCALE;
        const hTx = tex.height * COIN_SCALE;
        const x = Phaser.Math.Between(wTx / 2, this.scale.width - wTx / 2);
        const startY = Phaser.Math.Between(-hTx, 0);
        const endY = this.scale.height + hTx;

        const coin = this.add.image(x, startY, chosen.key).setScale(COIN_SCALE).setInteractive().setDepth(0);
        coin.setScale(chosen.key === 'coin2' ? 0.18 : 0.1);
        coin.points = chosen.points;
        coin.type = chosen.key;
        this.coins.add(coin);

        this.tweens.add({
          targets: coin,
          y: endY,
          duration: Phaser.Math.Between(8000, 11000),
          ease: 'Linear',
          repeat: -1,
          repeatDelay: Phaser.Math.Between(0, 1000)
        });
      }

      collectCoin(coin) {
        if (this.timeLeft <= 0 || !coin.active) return;
        this.counts[coin.type]++;
        this.scores[coin.type] += coin.points;
        this.texts[coin.type].setText(`${this.counts[coin.type]}  |  ${this.scores[coin.type]}`);
        coin.destroy();
        const totalWeight = COIN_TYPES.reduce((s, ct) => s + ct.weight, 0);
        this.spawnCoin(totalWeight);
      }

      endGame() {
        const total = Object.values(this.scores).reduce((s, v) => s + v, 0);
        this.shutdown();

        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7).setOrigin(0, 0).setDepth(5);
        const cx = this.scale.width / 2;
        let cy = this.scale.height / 2 - 40;

        this.add.text(cx, cy, '¡Tiempo terminado!', { font: '28px Arial', fill: '#fff' }).setOrigin(0.5).setDepth(6);
        cy += 40;
        this.add.text(cx, cy, `Puntos: ${total}`, { font: '24px Arial', fill: '#e1aa4a' }).setOrigin(0.5).setDepth(6);
        cy += 50;

        this.add.text(cx, cy, 'REINICIAR', {
          font: '26px Arial', fill: '#fff', backgroundColor: '#e1aa4a', padding: { x: 20, y: 10 }
        })
          .setOrigin(0.5)
          .setInteractive()
          .on('pointerdown', () => {
            this.scene.restart();
            setStarted(false);
            setShowPremios(true);
          })
          .setDepth(6);
      }

      shutdown() {
        if (this.timerEvent) this.timerEvent.remove(false);
      }
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      transparent: true,
      scene: CoinScene,
      scale: { width: side, height: side, mode: Phaser.Scale.NONE }
    });

    const onResize = () => {
      const newSide = Math.min(container.clientWidth, container.clientHeight);
      game.scale.resize(newSide, newSide);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      game.destroy(true);
    };
  }, [started]);

  const premiosModal = showPremios ? ReactDOM.createPortal(
    <div className="premios-modal" onClick={() => setShowPremios(false)}>
      <div className="premios-modal-content" onClick={(e) => e.stopPropagation()}>
        <img src="/assets/PREMIOS.png" alt="Premios" />
        <button className="premios-modal-close" onClick={() => setShowPremios(false)}>
          Continuar
        </button>
      </div>
    </div>, document.body
  ) : null;


  useEffect(() => {
    setTimeout(() => {
      const x = 100;
      const y = 100;
      const target = document.elementFromPoint(x, y);
      console.log("[TEST] Element at point:", target);

      if (target) {
        const event = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
        });
        target.dispatchEvent(event);
        console.log("[TEST] Dispatched click to:", target);
      }
    }, 100);
  }, []);

  useEffect(() => {
    const handler = () => console.log("[TEST] #test clicked");
    const el = document.getElementById("test");
    if (el) el.addEventListener("click", handler);
    return () => el?.removeEventListener("click", handler);
  }, []);


  return (

    <div
      id="test"
      style={{
        width: "100vw",
        height: "100vh",
        background: "blue",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      HOLA
    </div>
  
    
  );
}
