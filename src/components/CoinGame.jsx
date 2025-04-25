import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import "../index.css";

const TOTAL_COINS = 30;
const COIN_SCALE = 0.1;
const GAME_TIME = 20;

const COIN_TYPES = [
  {
    key: "coin1",
    asset: "/assets/MONEDA_01.png",
    weight: 3,
    label: "Moneda 1",
    points: 10,
  },
  {
    key: "coin2",
    asset: "/assets/MONEDA_02.png",
    weight: 1,
    label: "Moneda 2",
    points: 20,
  },
  {
    key: "betplay",
    asset: "/assets/LOGO-BETPLAY.png",
    weight: 1,
    label: "Logo Betplay",
    points: 40,
  },
  {
    key: "dorado",
    asset: "/assets/TEXTO-DORADO.png",
    weight: 1,
    label: "Texto Dorado",
    points: 50,
  },
];

export default function CoinGame() {
  const gameContainer = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;

    const container = gameContainer.current;
    let side = container.clientWidth;

    class CoinScene extends Phaser.Scene {
      constructor() {
        super({ key: "CoinScene" });
      }

      preload() {
        COIN_TYPES.forEach((ct) => this.load.image(ct.key, ct.asset));
        this.load.image("legales", "/assets/LEGALES.png");
        this.load.image("header", "/assets/FRASE_SUPERIOR.png");
      }

      create() {
        this.timeLeft = GAME_TIME;
        this.counts = {};
        this.scores = {};
        this.timerEvent = null;

        // Header FRASE_SUPERIOR (depth 4)
        this.headerImg = this.add
          .image(this.scale.width / 2, 0, "header")
          .setOrigin(0.5, 0)
          .setScale(0.25)
          .setDepth(4)
          .setY(50);

        // Footer LEGALES (depth 4)
        this.footerImg = this.add
          .image(this.scale.width / 2, this.scale.height, "legales")
          .setOrigin(0.5, 1)
          .setScale(0.3) // Ajusta escala según tu necesidad
          .setDepth(4);

        // Temporizador (depth 3)
        this.timerText = this.add
          .text(this.scale.width - 10, 10, `00:${GAME_TIME}`, {
            fontFamily: "Arial",
            fontSize: "28px",
            fontStyle: "normal",
            fontWeight: "bold",
            color: "#ffffff",
          })
          .setOrigin(1, -1)
          .setDepth(3);

        // Panel de puntuaciones (depth 1)
        const panelWidth = 190;
        const panelX = this.scale.width - panelWidth - 10;
        const panelY = 80;
        const panelHeight = COIN_TYPES.length * 40 + 20;

        // 2) Fondo y borde con Graphics
        const gfx = this.add.graphics().setDepth(1);
        gfx.fillStyle(0x000000, 0.6);
        gfx.fillRect(panelX, panelY, panelWidth, panelHeight);

        // 3) Calcula el centro interno del panel
        const contentCenterX = panelX + panelWidth / 2;

        // 4) Contenido centrado y texto en negrita
        this.texts = {};
        COIN_TYPES.forEach((ct, idx) => {
          this.counts[ct.key] = 0;
          this.scores[ct.key] = 0;

          const yRow = panelY + 10 + idx * 40;

          // Icono centrado a la izquierda del centro
          this.add
            .image(contentCenterX - 40, yRow + 15, ct.key)
            .setScale(0.055)
            .setDepth(2)
            .setOrigin(0.5);

          // “x” justo en el centro
          this.add
            .text(contentCenterX, yRow, "x", {
              font: "bold 20px Arial",
              fill: "#fff",
            })
            .setDepth(2)
            .setOrigin(0.3, 0);

          // Contador a la derecha del centro
          this.texts[ct.key] = this.add
            .text(contentCenterX + 20, yRow, "0  |  0", {
              font: "bold 20px Arial",
              fill: "#fff",
            })
            .setDepth(2)
            .setOrigin(0.1, 0);
        });

        // Generar monedas
        this.coins = this.add.group();
        const totalWeight = COIN_TYPES.reduce((s, ct) => s + ct.weight, 0);
        for (let i = 0; i < TOTAL_COINS; i++) this.spawnCoin(totalWeight);

        // Clic en moneda
        this.input.on("gameobjectdown", (_, coin) => this.collectCoin(coin));

        // Temporizador (guardado en variable)
        this.timerEvent = this.time.addEvent({
          delay: 1000,
          repeat: GAME_TIME - 1,
          callback: () => {
            this.timeLeft--;
            this.timerText.setText(
              `00:${this.timeLeft.toString().padStart(2, "0")}`
            );
            if (this.timeLeft === 0) this.endGame();
          },
        });

        // Limpiar temporizador al reiniciar o cerrar escena
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
      }

      spawnCoin(totalW) {
        const rnd = Phaser.Math.Between(1, totalW);
        let acc = 0;
        const chosen = COIN_TYPES.find((ct) => {
          acc += ct.weight;
          return rnd <= acc;
        });

        const tex = this.textures.get(chosen.key).getSourceImage();
        const wTx = tex.width * COIN_SCALE;
        const hTx = tex.height * COIN_SCALE;
        const x = Phaser.Math.Between(wTx / 2, this.scale.width - wTx / 2);
        const startY = Phaser.Math.Between(-hTx, 0);
        const endY = this.scale.height + hTx;

        const coin = this.add
          .image(x, startY, chosen.key)
          .setScale(COIN_SCALE)
          .setInteractive({ useHandCursor: true })
          .setDepth(0);
        let customScale;
        if (chosen.key === "betplay") {
          customScale = 0.18;
        } else if (chosen.key === "dorado") {
          customScale = 0.15; // ajusta este valor al tamaño que quieras para "dorado"
        } else {
          customScale = COIN_SCALE;
        }
        coin.setScale(customScale);
        coin.points = chosen.points;
        coin.type = chosen.key;
        this.coins.add(coin);

        this.tweens.add({
          targets: coin,
          y: endY,
          duration: Phaser.Math.Between(5000, 8000),
          ease: "Linear",
          repeat: -1,
          repeatDelay: Phaser.Math.Between(0, 1000),
        });
      }

      collectCoin(coin) {
        if (this.timeLeft <= 0 || !coin.active) return;
        this.counts[coin.type]++;
        this.scores[coin.type] += coin.points;
        this.texts[coin.type].setText(
          `${this.counts[coin.type]}  |  ${this.scores[coin.type]}`
        );
        coin.destroy();
        const totalWeight = COIN_TYPES.reduce((s, ct) => s + ct.weight, 0);
        this.spawnCoin(totalWeight);
      }

      endGame() {
        const total = Object.values(this.scores).reduce((s, v) => s + v, 0);
        this.shutdown();

        this.add
          .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
          .setOrigin(0, 0)
          .setDepth(5);

        const cx = this.scale.width / 2;
        let cy = this.scale.height / 2 - 40;

        this.add
          .text(cx, cy, "¡Tiempo terminado!", {
            font: "28px Arial",
            fill: "#fff",
          })
          .setOrigin(0.5)
          .setDepth(6);
        cy += 40;
        this.add
          .text(cx, cy, `Puntos: ${total}`, {
            font: "24px Arial",
            fill: "#e1aa4a",
          })
          .setOrigin(0.5)
          .setDepth(6);
        cy += 50;

        this.add
          .text(cx, cy, "REINICIAR", {
            font: "26px Arial",
            fill: "#fff",
            backgroundColor: "#e1aa4a",
            padding: { x: 20, y: 10 },
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on("pointerdown", () => this.scene.restart())
          .setDepth(6);
      }

      shutdown() {
        if (this.timerEvent) {
          this.timerEvent.remove(false);
          this.timerEvent = null;
        }
      }
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      transparent: true,
      scene: CoinScene,
      scale: { width: side, height: side, mode: Phaser.Scale.NONE },
    });

    const onResize = () => {
      side = container.clientWidth;
      game.scale.resize(side, side);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      game.destroy(true);
    };
  }, [started]);

  return (
    <div ref={gameContainer} className="coin-container" key={started}>
      {!started && (
        <div className="coin-overlay">
          <img src="/assets/MONEDAS.png" alt="Monedas" className="logo" />
          <button className="start-button" onClick={() => setStarted(true)}>
            EMPEZAR
          </button>
        </div>
      )}
    </div>
  );
}
