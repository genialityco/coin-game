// hooks/useHandTracking.ts
import { useEffect, useRef, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export interface HandPoint {
  id: string;
  x: number;
  y: number;
  z: number;
  isGrabbing: boolean;
  depth: number;
  landmarks: any[];
}

export function useHandTracking(videoRef: React.RefObject<HTMLVideoElement>) {
  const [hands, setHands] = useState<HandPoint[]>([]);
  const handsRef = useRef<HandPoint[]>([]);

  useEffect(() => {
    if (!videoRef.current) return;

    const handsInstance = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    handsInstance.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    handsInstance.onResults((results) => {
      const newHands: HandPoint[] = [];

      if (results.multiHandLandmarks && results.multiHandedness) {
        results.multiHandLandmarks.forEach((landmarks, idx) => {
          const handedness = results.multiHandedness[idx];
          const isLeft = handedness.label === 'Left';

          // Centro de la palma
          const palm = landmarks[0];
          const wrist = landmarks[0];
          const mcp = landmarks[9];
          const depth = (palm.z + wrist.z + mcp.z) / 3;
          const depthNorm = Math.round((1 - depth) * 1000); // ~200-800 mm

          // Detección de puño
          const tips = [4, 8, 12, 16, 20];
          const pips = [3, 6, 10, 14, 18];
          let curled = 0;
          for (let i = 0; i < 5; i++) {
            if (landmarks[tips[i]].y > landmarks[pips[i]].y) curled++;
          }
          const isGrabbing = curled >= 4;

          newHands.push({
            id: `hand_${isLeft ? 'left' : 'right'}_${idx}`,
            x: palm.x,
            y: palm.y,
            z: depth,
            depth: depthNorm,
            isGrabbing,
            landmarks,
          });
        });
      }

      handsRef.current = newHands;
      setHands(newHands);
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await handsInstance.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => {
      camera.stop();
    };
  }, [videoRef]);

  return hands;
}