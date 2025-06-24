import React, { useEffect, useRef } from 'react';
import { useTouchPoints } from '../hooks/useTouchPoints';
import './TouchDebugOverlay.css';

const CLICK_INTERVAL_MS = 200; // 5 clicks por segundo como máximo

export function TouchDebugOverlay() {
    const touchPoints = useTouchPoints();
    const lastClickTimestamps = useRef<Record<string, number>>({});

    useEffect(() => {
        const now = Date.now();

        for (const pt of touchPoints) {
           // if (!pt.is_touching) continue;

            const x = window.innerWidth - (pt['2d_x_px'] / 640) * window.innerWidth;
            const y = (pt['2d_y_px'] / 480) * window.innerHeight;
            const id = pt.id;

            const lastClick = lastClickTimestamps.current[id] || 0;

            if (now - lastClick >= CLICK_INTERVAL_MS) {
                // Dispatch synthetic click
                const target = document.elementFromPoint(x, y);
                if (target) {
                     console.log(`[TOUCH DEBUG] Dispatching pointerdown and click at (${x}, ${y}) on`, target);
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        clientX: x,
                        clientY: y,
                    });
                    target.dispatchEvent(clickEvent);

                    const pointerEvent = new PointerEvent('pointerdown', {
                        bubbles: true,
                        cancelable: true,
                        clientX: x,
                        clientY: y,
                        pointerType: 'touch',
                    });
                    target.dispatchEvent(pointerEvent);
                }

                lastClickTimestamps.current[id] = now;
            }
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
