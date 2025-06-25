import React, { useEffect, useRef } from 'react';
import { useTouchPoints } from '../hooks/useTouchPoints';
import './TouchDebugOverlay.css';
import { getActivePhaserGame } from '../utils/phaserInstance';
import { simulatePhaserClick } from '../utils/simulatePhaserClick';

const CLICK_INTERVAL_MS = 100;

export function TouchDebugOverlay() {
  const touchPoints = useTouchPoints();
  const lastTimestamps = useRef<Record<string, number>>({});

  useEffect(() => {
    const now = Date.now();


    const game = getActivePhaserGame();

    if (game) simulatePhaserClick(game, 100, 100);

    for (const pt of touchPoints) {
      //if (!pt.is_touching) continue;
      const last = lastTimestamps.current[pt.id] || 0;
      if (now - last < CLICK_INTERVAL_MS) continue;

      // Cliente → Phaser coords
      const clientX = window.innerWidth - (pt['2d_x_px'] / 640) * window.innerWidth;
      const clientY = (pt['2d_y_px'] / 480) * window.innerHeight;

      const target = document.elementFromPoint(clientX, clientY);
      if (target) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: clientX,
          clientY: clientY,
          button: 0,
        });
        target.dispatchEvent(clickEvent);
      }

      if (game) {
        const canvas = game.canvas;
        const rect = canvas.getBoundingClientRect();
        const scaleX = (game.config.width as number) / rect.width;
        const scaleY = (game.config.height as number) / rect.height;
        const phaserX = (clientX - rect.left) * scaleX;
        const phaserY = (clientY - rect.top) * scaleY;
        simulatePhaserClick(game, phaserX, phaserY);
      }





      lastTimestamps.current[pt.id] = now;
    }
  }, [touchPoints]);

  return (
    <div className="touch-debug-overlay">
      {touchPoints.map(pt => {
        const x = window.innerWidth - (pt['2d_x_px'] / 640) * window.innerWidth;
        const y = (pt['2d_y_px'] / 480) * window.innerHeight;
        return (
          <div
            key={pt.id}
            className={`touch-point-marker ${pt.is_touching ? 'touching' : ''}`}
            style={{ left: x, top: y }}
          >
            <span className="label">{pt.name} ({Math.round(x)}, {Math.round(y)})</span>
          </div>
        );
      })}
    </div>
  );
}
