/* eslint-disable no-unused-vars */
// components/HandOverlay.tsx
import React from 'react';
import { useHandTracking } from '../hooks/useHandTracking';
import { getActivePhaserGame } from '../utils/phaserInstance';
import './HandOverlay.css';

const DIST_MIN = 300;
const DIST_MAX = 1200;

export function HandOverlay() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const hands = useHandTracking(videoRef);
  const lastGrab = React.useRef<Record<string, number>>({});

  React.useEffect(() => {
  const game = getActivePhaserGame();
  if (!game) return;
  const scene = game.scene.getScene('CoinScene') as any;
  if (!scene) return;

  const now = Date.now();
  const COOLDOWN = 300;

  hands.forEach(hand => {
    if (!hand.isGrabbing) return;
    if (hand.depth < DIST_MIN || hand.depth > DIST_MAX) return;
    if (lastGrab.current[hand.id] && now - lastGrab.current[hand.id] < COOLDOWN) return;

    const canvas = game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = game.config.width / rect.width;
    const scaleY = game.config.height / rect.height;

    const clientX = (1-hand.x) * window.innerWidth;
    const clientY = hand.y * window.innerHeight;
    const phaserX = (clientX - rect.left) * scaleX;
    const phaserY = (clientY - rect.top) * scaleY;

    // Crear un puntero temporal
    const pointer = { x: phaserX, y: phaserY, id: hand.id } as Phaser.Input.Pointer;

    // Hacer hit-test en las monedas (exactamente como hace Phaser)
    const coins = scene.coins.getChildren();
    const hitCoins = scene.input.hitTestPointer(pointer, coins);

    if (hitCoins.length > 0) {
      const coin = hitCoins[0];
      scene.collectCoin(coin); // Llama exactamente a la misma función que el clic
      lastGrab.current[hand.id] = now;
    }
  });
}, [hands]);
  return (
    <>
      <video
  ref={videoRef}
  className="hand-camera"
  style={{ display: 'none' }}
  autoPlay
  playsInline
/>
      <div className="hand-overlay">
        {hands.map(hand => {
          const x = (1-hand.x) * window.innerWidth;
          const y = hand.y * window.innerHeight;
          const inRange = hand.depth >= DIST_MIN && hand.depth <= DIST_MAX;
          const color = inRange ? (hand.isGrabbing ? '#00ff00' : '#ffff00') : '#ff0000';

          return (
            <div
            key={hand.id}
            className="hand-marker"
            style={{
              left: x -40,
              top: y-40,
            
            }}
          >
            <img
              src={hand.isGrabbing ? '/assets/hands/hand_grab.png' : '/assets/hands/hand_open.png'}
              alt={hand.isGrabbing ? 'Mano cerrada' : 'Mano abierta'}
              style={{
                width: '80px',
                height: '80px',
                
                transition: 'transform 0.2s ease',
                transform: hand.isGrabbing ? 'scale(1.1)' : 'scale(1)',
              }}
            />
          
          
          </div>
          );
        })}
      </div>
    </>
  );
}