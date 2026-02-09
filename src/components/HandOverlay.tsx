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
  const lastGrabState = React.useRef<Record<string, boolean>>({}); // Rastrear estado anterior

  React.useEffect(() => {
    const game = getActivePhaserGame();
    const now = Date.now();
    const COOLDOWN = 300;

    hands.forEach(hand => {
      const handId = hand.id;
      const wasGrabbing = lastGrabState.current[handId] || false;
      const isGrabbing = hand.isGrabbing;
      
      // Solo procesar si hay una transición de ABIERTA a CERRADA
      const justStartedGrabbing = !wasGrabbing && isGrabbing;
      
      // Actualizar estado SIEMPRE
      lastGrabState.current[handId] = isGrabbing;
      
      if (!justStartedGrabbing) {
        return;
      }
      
      // Emitir evento de gesto de agarre SIEMPRE (para el botón de inicio y otros)
      const event = new CustomEvent('handGrab', {
        detail: { handId, x: hand.x, y: hand.y }
      });
      window.dispatchEvent(event);
      console.log('🖐️ Evento handGrab emitido');

      // Si no hay juego activo, solo emitir el evento
      if (!game) return;
    
      const scene = game.scene.getScene('CoinScene') as any;
      if (!scene) return;
      
      // Cooldown para no agarrar múltiples globos
      if (lastGrab.current[handId] && now - lastGrab.current[handId] < COOLDOWN) {
        return;
      }

      // Validar profundidad
      if (hand.depth < DIST_MIN || hand.depth > DIST_MAX) {
        return;
      }
  
      const canvas = game.canvas;
      const rect = canvas.getBoundingClientRect();
      const scaleX = game.config.width / rect.width;
      const scaleY = game.config.height / rect.height;
  
      const clientX = (1 - hand.x) * window.innerWidth;
      const clientY = hand.y * window.innerHeight;
      const phaserX = (clientX - rect.left) * scaleX;
      const phaserY = (clientY - rect.top) * scaleY;
  
      const pointer = { x: phaserX, y: phaserY, id: hand.id } as Phaser.Input.Pointer;
  
      // ✅ Verificación segura antes de acceder a coins
      if (!scene.coins || !scene.input || !scene.collectCoin) {
        return;
      }

      const coins = typeof scene.coins.getChildren === 'function'
        ? scene.coins.getChildren()
        : [];
  
      if (!coins || coins.length === 0) {
        return;
      }
  
      try {
        const hitCoins = scene.input.hitTestPointer(pointer, coins);
    
        if (hitCoins && hitCoins.length > 0) {
          const coin = hitCoins[0];
          if (typeof scene.collectCoin === 'function') {
            scene.collectCoin(coin);
            console.log('💥 Globo capturado');
          }
          lastGrab.current[handId] = now;
        }
      } catch (error) {
        console.warn('Error en detección de globos:', error);
      }
    });
  }, [hands]);

  // Limpiar estado cuando el componente se desmonta
  React.useEffect(() => {
    return () => {
      lastGrab.current = {};
      lastGrabState.current = {};
    };
  }, []);

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
                width: '220px',
                height: '140px',
                
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