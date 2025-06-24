import React, { useEffect, useRef } from 'react';
import { useTouchPoints } from '../hooks/useTouchPoints';
import './TouchDebugOverlay.css';
import { getActivePhaserGame } from '../utils/phaserInstance'; // Asegúrate de exponer esto

const CLICK_INTERVAL_MS = 1000; // 5 clicks por segundo como máximo

export function TouchDebugOverlay() {
    const touchPoints = useTouchPoints();
    const lastClickTimestamps = useRef<Record<string, number>>({});
    useEffect(() => {

        document.addEventListener("click", (e) => {
            console.log("[REAL CLICK] at", e.clientX, e.clientY, "target:", e.target);
        });

        //         canvas.addEventListener('pointerdown', (e) => {
        //   console.log('Canvas received pointerdown:', e);
        // });

        // canvas.addEventListener('mousedown', (e) => {
        //   console.log('Canvas received mousedown:', e);
        // });
    }, [])
    useEffect(() => {
        const now = Date.now();
        const game = getActivePhaserGame();


        for (const pt of touchPoints) {
            //if (!pt.is_touching) continue;

            const x = window.innerWidth - (pt['2d_x_px'] / 640) * window.innerWidth;
            const y = (pt['2d_y_px'] / 480) * window.innerHeight;
            const id = pt.id;

            const lastClick = lastClickTimestamps.current[id] || 0;
            if (now - lastClick < CLICK_INTERVAL_MS) continue;


            // Dispatch synthetic click
            const target = document.elementFromPoint(x, y);
            if (target) {
                //console.log(`[TOUCH DEBUG] Dispatching pointerdown and click at (${x}, ${y}) on`, target);
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    clientX: x,
                    clientY: y,
                    button: 0 // left mouse button
                });
                target.dispatchEvent(clickEvent);

                const pointerEvent = new PointerEvent('pointerdown', {
                    bubbles: true,
                    cancelable: true,
                    clientX: x,
                    clientY: y,
                    pointerType: 'touch',
                    pointerId: 1,
                    // pointerType: 'mouse',
                    isPrimary: true,
                    button: 0
                });
                target.dispatchEvent(pointerEvent);

                // Up event (after a small delay to simulate real click)
                setTimeout(() => {
                    const pointerUp = new PointerEvent('pointerup', {
                        bubbles: true,
                        cancelable: true,
                        clientX: x,
                        clientY: y,
                        pointerId: 1,
                        pointerType: 'mouse',
                        isPrimary: true
                    });
                    target.dispatchEvent(pointerUp);
                }, 50);

            }


            ////

            // Get canvas and convert coordinates
            if (game) {
                const canvas = game.canvas;
                const rect = canvas.getBoundingClientRect();
                const scaleX = game.config.width / rect.width;
                const scaleY = game.config.height / rect.height;

                // Convert client coordinates to Phaser coordinates
                const phaserX = (x - rect.left) * scaleX;
                const phaserY = (y - rect.top) * scaleY;

                const pointerfull = game.input.activePointer;
                pointerfull.x = phaserX;
                pointerfull.y = phaserY;
                pointerfull.isDown = true;


                // Get input plugin from current scene
                if (game.scene && game.scene.scenes && game.scene.scenes[0]) {
                    console.log("scene", game.scene.scenes)
                    const scene = game.scene.scenes[0]
                    // Manually call the internal handler (NOT emit)
                    scene.input.emit('pointerdown', pointerfull);
                    const inputPlugin = scene.input; // Adjust scene index/name
                    console.log("simulando", phaserX, phaserY, inputPlugin)
                    // Create synthetic Phaser pointer
                    const pointer = new Phaser.Input.Pointer(inputPlugin, {
                        id: 1,
                        x: phaserX,
                        y: phaserY,
                        down: true
                    });
                    // Make Phaser process the event
                    //inputPlugin.update();
                    //inputPlugin._onPointerDown(pointer);
                }


            }
            ////







            lastClickTimestamps.current[id] = now;
        }
    }, [touchPoints]);
    return (
        <div className="touch-debug-overlay">
            {touchPoints.map((pt) => {
                const x = window.innerWidth - (pt['2d_x_px'] / 640) * window.innerWidth;
                const y = (pt['2d_y_px'] / 480) * window.innerHeight;

                return (
                    <div
                        key={pt.id}
                        className={`touch-point-marker ${pt.is_touching ? 'touching' : ''}`}
                        style={{ left: `${x}px`, top: `${y}px` }}
                    >
                        <span className="label">
                            {pt.name}
                            <br />
                            ({Math.round(x)}, {Math.round(y)})
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
