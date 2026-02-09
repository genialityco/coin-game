/* eslint-disable no-unused-vars */
// pages/CoinGame.tsx
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import Phaser from "phaser";
import { useTouchPoints } from "../hooks/useTouchPoints";
import "../index.css";
//import { TouchDebugOverlay } from "./TouchDebugOverlay";
import { setActivePhaserGame } from "../utils/phaserInstance";
import { HandOverlay } from "./HandOverlay";

// import { simulateClickOnCanvas } from "../utils/simulateClick";

const TOTAL_COINS = 30;
const COIN_SCALE = 0.8;
const GAME_TIME = 20; 
const COIN_TYPES = [
  {
    key: "coin1",
    asset: "/assets/globo_rojo.png",
    weight: 3,
    label: "Moneda",
    points: 20,
  },

  {
    key: "buho",
    asset: "/assets/globo_dorado.png",
    weight: 1,
    label: "Logo Buho",
    points: 50,
  },
];

export default function CoinGame() {
  const gameContainer = useRef(null);
  const gameRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [showPremios, setShowPremios] = useState(true);
  const touchPoints = useTouchPoints();
  const sceneRef = useRef({ touchPoints });

  useEffect(() => {
    sceneRef.current.touchPoints = touchPoints;
  }, [touchPoints]);

  // Listener para activar el juego con gesto de agarre SOBRE EL BOTÓN
  useEffect(() => {
    if (started) return;
    
    const handleHandGrab = (event) => {
      const { x, y } = event.detail;
      
      // Obtener dimensiones del botón START
      const startButton = document.querySelector('.start-button');
      if (!startButton) return;
      
      const rect = startButton.getBoundingClientRect();
      
      // Agregar margen para detectar cerca del botón (20% más)
      const margin = 40;
      const buttonArea = {
        left: rect.left - margin,
        right: rect.right + margin,
        top: rect.top - margin,
        bottom: rect.bottom + margin
      };
      
      // Convertir coordenadas de mano (0-1) a píxeles
      const clientX = (1 - x) * window.innerWidth;
      const clientY = y * window.innerHeight;
      
      // Verificar si el gesto está dentro del área del botón
      if (clientX >= buttonArea.left && clientX <= buttonArea.right &&
          clientY >= buttonArea.top && clientY <= buttonArea.bottom) {
        setStarted(true);
        setShowPremios(false);
      }
    };
    
    window.addEventListener('handGrab', handleHandGrab);
    return () => window.removeEventListener('handGrab', handleHandGrab);
  }, [started]);

  useEffect(() => {
    console.log("CoinScene no ha iniciado");
    if (!started) return;
    console.log("started");
    const container = gameContainer.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    class CoinScene extends Phaser.Scene {
      constructor() {
        super("CoinScene");
      }

      preload() {
        COIN_TYPES.forEach((ct) => this.load.image(ct.key, ct.asset));
        this.load.image("explosion_rojo", "/assets/globo_rojo_explo.png"); // Cargar imagen de explosión
        this.load.image("explosion_dorado", "/assets/globo_dorado_explo.png");
        //this.load.image("legales", "/assets/quinta/TEXTOS_LEGALES.png");
        //this.load.image("header", "/assets/colombia 4.0/JUEGO CORTES/LOGO_GEN.png");
        this.load.audio("coinSound", "/assets/globo_ex.mp3"); 
      }

      create() {
        this.timeLeft = GAME_TIME;
        this.counts = {};
        this.scores = {};
        this.timerEvent = null;
        this.coinSound = this.sound.add("coinSound");


        // this.headerImg = this.add
        //   .image(this.scale.width / 2, 50, "header")
        //   .setOrigin(0.5, -0.5)
        //   .setScale(0.25)
        //   .setDepth(4);
        this.footerImg = this.add
          .image(this.scale.width / 2, this.scale.height, "legales")
          .setOrigin(0.5, 1)
          .setScale(0.3)
          .setDepth(4);
        const rightMargin = 100; // Ajusta este valor para más o menos margen
        
        this.timerText = this.add
          .text(this.scale.width - rightMargin, 10, `00:${GAME_TIME}`, {
            fontFamily: "Arial",
            fontSize: "28px",
            fontWeight: "bold",
            color: "#ffffff",
          })
          .setOrigin(1, -2.5)
          .setDepth(3);

        const panelWidth = 190,
          panelX = this.scale.width - panelWidth - rightMargin,
          panelY = 120,
          panelHeight = COIN_TYPES.length * 40 + 20;
        const gfx = this.add.graphics().setDepth(1);
        gfx
          .fillStyle(0x000000, 0.6)
          .fillRect(panelX, panelY, panelWidth, panelHeight);

        const contentCenterX = panelX + panelWidth / 2;
        this.texts = {};
        COIN_TYPES.forEach((ct, idx) => {
          this.counts[ct.key] = 0;
          this.scores[ct.key] = 0;
          const yRow = panelY + 10 + idx * 40;
          const iconScale = ct.key === "coin2" ? 0.1 : 0.045;
          this.add
            .image(contentCenterX - 50, yRow + 15, ct.key)
            .setScale(iconScale)
            .setDepth(2)
            .setOrigin(0.5);
          this.add
            .text(contentCenterX, yRow, "x", {
              font: "bold 20px Arial",
              fill: "#fff",
            })
            .setDepth(2)
            .setOrigin(0.3, 0);
          this.texts[ct.key] = this.add
            .text(contentCenterX + 20, yRow, "0  |  0", {
              font: "bold 20px Arial",
              fill: "#fff",
            })
            .setDepth(2)
            .setOrigin(0.1, 0);
        });

        this.botones = this.add.group();

        this.coins = this.add.group();
        const totalWeight = COIN_TYPES.reduce((s, ct) => s + ct.weight, 0);

        let spawnedCoins = 0;
        const spawnInterval = 500;

        this.coinSpawnTimer = this.time.addEvent({
          delay: spawnInterval,
          repeat: TOTAL_COINS - 1,
          callback: () => {
            this.spawnCoin(totalWeight);
            spawnedCoins++;
          },
        });

        this.input.on("gameobjectdown", (_, coin) => this.collectCoin(coin));

        this.touchMarkers = [];
        this.touchDebugText = this.add
          .text(10, 10, "", {
            font: "14px Courier",
            fill: "#ff0000",
            align: "left",
          })
          .setDepth(11)
          .setScrollFactor(0);

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

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
      }

      // NUEVA FUNCIÓN: Muestra el puntaje flotante
      showFloatingScore(x, y, points) {
        const scoreText = this.add
          .text(x, y, `+${points}`, {
            fontFamily: "Arial",
            fontSize: "40px",
            fontWeight: "bold",
            color: "#FFD700", // Color dorado
            stroke: "#000000",
            strokeThickness: 4,
          })
          .setOrigin(0.5)
          .setDepth(9);

        // Animación: se eleva y desaparece
        this.tweens.add({
          targets: scoreText,
          y: y - 100, // Se eleva 100 píxeles
          alpha: 0, // Desaparece gradualmente
          scale: 1.3, // Crece un poco
          duration: 1200, // Duración de 1.2 segundos
          ease: "Power2",
          onComplete: () => {
            scoreText.destroy(); // Elimina el texto cuando termina
          },
        });
      }

      update() {
        // La detección de gestos ahora se maneja completamente en HandOverlay.tsx
        // Solo mantenemos la visualización de debug si es necesario
        const points = sceneRef.current.touchPoints;
        if (!points || !points.length) return;
      
        const w = this.scale.width;
        const h = this.scale.height;
      
        this.touchMarkers.forEach((marker) => marker.destroy());
        this.touchMarkers = [];
      
        let debugLines = [];
      
        const TOUCH_RADIUS = 160;
      
        points.forEach((pt) => {
          if (!pt.is_touching) return;
          const x = w - (pt["2d_x_px"] / 640) * w;
          const y = (pt["2d_y_px"] / 480) * h;
      
          const marker = this.add.circle(x, y, TOUCH_RADIUS, 0xff0000, 0.2).setDepth(10);
          this.touchMarkers.push(marker);
      
          debugLines.push(`${pt.id}: (${Math.round(x)}, ${Math.round(y)})`);
        });
      
        this.touchDebugText.setText(debugLines.join("\n"));
      }

      spawnCoin(totalWeight) {
        const rnd = Phaser.Math.Between(1, totalWeight);
        let acc = 0;
        const chosen = COIN_TYPES.find((ct) => (acc += ct.weight) >= rnd);

        const tex = this.textures.get(chosen.key).getSourceImage();
        // const wTx = tex.width * COIN_SCALE;
        const hTx = tex.height * COIN_SCALE;
        const marginX = this.scale.width * 0.25; // 15% de margen a cada lado (70% total)
        const x = Phaser.Math.Between(marginX, this.scale.width - marginX);
        const startY = Phaser.Math.Between(-hTx, 0);
        const endY = this.scale.height + hTx;

        const coin = this.add
          .image(x, startY, chosen.key)
          .setScale(COIN_SCALE)
          .setInteractive()
          .setDepth(0);
        coin.setScale(chosen.key === "coin2" ? 0.35 : 0.25);
        coin.points = chosen.points;
        coin.type = chosen.key;
        this.coins.add(coin);

        this.tweens.add({
          targets: coin,
          y: endY,
          duration: Phaser.Math.Between(12000, 16000),
          ease: "Linear",
          repeat: -1,
          repeatDelay: Phaser.Math.Between(0, 1000),
        });
      }

  collectCoin(coin) {
  if (this.timeLeft <= 0 || !coin.active) return;
  
  const coinX = coin.x;
  const coinY = coin.y;
  const coinPoints = coin.points;
  
  if (this.coinSound && this.sound.locked === false) {
    this.coinSound.play();
  }
  const explosionKey = coin.type === "buho" ? "explosion_dorado" : "explosion_rojo";
  // --- CORRECCIÓN AQUÍ ---
  // Creamos la explosión con una escala inicial más visible (0.5 o similar)
  const explosionImage = this.add
    .image(coinX, coinY, explosionKey)
    .setScale(0.3) // Aumentamos un poco el tamaño inicial
    .setDepth(20);  // Aseguramos que esté por encima de TODO (incluso del HUD)
  
  this.tweens.add({
    targets: explosionImage,
    scale: 0.6,    // Que crezca al explotar
    alpha: 0,
    duration: 500,
    ease: "Cubic.out",
    onComplete: () => {
      explosionImage.destroy();
    },
  });
  // ------------------------
  
  this.createLightExplosion(coinX, coinY);
  
  this.counts[coin.type]++;
  this.scores[coin.type] += coin.points;
  this.texts[coin.type].setText(
    `${this.counts[coin.type]}  |  ${this.scores[coin.type]}`
  );
  
  this.showFloatingScore(coinX, coinY, coinPoints);
  
  coin.destroy();
  const totalWeight = COIN_TYPES.reduce((s, ct) => s + ct.weight, 0);
  this.spawnCoin(totalWeight);
}

      createLightExplosion(x, y) {
        // Crear luces que se dispersan en diferentes direcciones
        for (let i = 0; i < 15; i++) {
          const angle = (i / 15) * Math.PI * 2;
          const speed = Phaser.Math.Between(200, 400);
          
          // Luces con diferentes colores (amarillo, naranja, rojo)
          const colors = [0xffff00, 0xffa500, 0xff6600];
          const lightColor = colors[Math.floor(Math.random() * colors.length)];
          
          const light = this.add.circle(x, y, 8, lightColor, 1);
          light.setDepth(7);
          
          // Animación de dispersión
          const targetX = x + Math.cos(angle) * 120;
          const targetY = y + Math.sin(angle) * 120;
          
          this.tweens.add({
            targets: light,
            x: targetX,
            y: targetY,
            alpha: 0,
            scale: 0.3,
            duration: 500,
            ease: "Power2",
            delay: i * 20, // Efecto de cascada
            onComplete: () => {
              light.destroy();
            },
          });
        }
        
        // Crear un efecto de destello central
        const flare = this.add.circle(x, y, 20, 0xffffff, 0.8);
        flare.setDepth(7);
        this.tweens.add({
          targets: flare,
          scale: 0.2,
          alpha: 0,
          duration: 300,
          ease: "Power1",
          onComplete: () => {
            flare.destroy();
          },
        });
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
          .text(cx, cy, `Has conseguido ${total} puntos!`, {
            font: "24px Arial",
            fill: "#e1aa4a",
          })
          .setOrigin(0.5)
          .setDepth(6);
        cy += 50;

        let boton_reiniciar = this.add
          .text(cx, cy, "REINICIAR", {
            font: "26px Arial",
            fill: "#fff",
            backgroundColor: "#e1aa4a",
            padding: { x: 20, y: 10 },
          })
          .setOrigin(0.5)
          .setInteractive()
          .on("pointerdown", () => {

            this.scene.restart();
            setStarted(false);
            setShowPremios(true);
          })
          .setDepth(6);
        this.botones.add(boton_reiniciar)
      }

      shutdown() {
        if (this.timerEvent) this.timerEvent.remove(false);
      }
    }


    console.log("CoinScene or");
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      transparent: true,
      scene: CoinScene,
      scale: { 
        width: width, 
        height: height, 
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
    });
    console.log("GAME or", game);
    setActivePhaserGame(game);

    gameRef.current = game;

    const onResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      game.scale.resize(newWidth, newHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      game.destroy(true);
    };
  }, [started]);

  const premiosModal = showPremios
    ? ReactDOM.createPortal(
      <div className="premios-modal" onClick={() => setShowPremios(false)}>
        <div
          className="premios-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <img src="/assets/PREMIOS.png" alt="Premios" />
          <button
            className="premios-modal-close"
            onClick={() => setShowPremios(false)}
          >
            Continuar
          </button>
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <>
      <div ref={gameContainer} className="coin-container" style={{ padding: '0 20px' }} key={started}>
        {!started && (
          <div className="coin-overlay">
            <img
              src="/assets/colombia 4.0/JUEGO CORTES/LOGO_GEN.png"
              alt="Monedas"
              className="logo_solar"
            />
            <button className="start-button" onClick={() => setStarted(true)}>
              EMPEZAR
            </button>
            
            {/* Animación de indicador de gesto debajo del botón */}
            <div className="gesture-hint">
              <div className="gesture-sequence">
                <img 
                  src="/assets/hands/hand_open.png" 
                  alt="Mano abierta"
                  className="gesture-hand open"
                />
                <span className="gesture-arrow">⬇</span>
                <img 
                  src="/assets/hands/hand_grab.png" 
                  alt="Mano cerrada"
                  className="gesture-hand grab"
                />
              </div>
              <p className="gesture-text">Cierra la mano para empezar</p>
            </div>
          </div>
        )}
      </div>
      <HandOverlay />
    </>
  );
}