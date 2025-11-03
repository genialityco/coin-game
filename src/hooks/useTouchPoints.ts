// hooks/useTouchPoints.ts
import useWebSocket from 'react-use-websocket';
import { useEffect, useState } from 'react';

export interface TouchPoint {
  id: string;
  x: number;
  y: number;
  z: number;
  is_touching: boolean;
  name: string;
  bodypart: string;
  '2d_x_px': number;
  '2d_y_px': number;
  '2d_depth': number;
  // Añadimos landmarks si los recibes desde el backend
  landmarks?: any[];
  is_grabbing?: boolean; // ← nuevo
}

export function useTouchPoints(): TouchPoint[] {
  const [touches, setTouches] = useState<TouchPoint[]>([]);

  // const { lastJsonMessage } = useWebSocket('ws://localhost:8000/ws/touches', {
  //   share: true,
  //   shouldReconnect: () => true,
  // });

  // --- Función para detectar puño cerrado ---
  const isFist = (landmarks: any[]) => {
    if (!landmarks || landmarks.length < 21) return false;

    const tips = [4, 8, 12, 16, 20]; // puntas de dedos
    const pips = [3, 6, 10, 14, 18]; // articulaciones medias

    let curledCount = 0;
    for (let i = 0; i < tips.length; i++) {
      const tip = landmarks[tips[i]];
      const pip = landmarks[pips[i]];
      if (tip.y > pip.y) curledCount++; // si la punta está más abajo que la articulación → dedo doblado
    }
    return curledCount >= 4; // 4+ dedos doblados = puño
  };

  // useEffect(() => {
  //   if (lastJsonMessage && Array.isArray(lastJsonMessage)) {
  //     const processed = lastJsonMessage.map((pt: any) => {
  //       const isGrabbing = pt.landmarks ? isFist(pt.landmarks) : false;
  //       return { ...pt, is_grabbing: isGrabbing };
  //     });
  //     setTouches(processed);
  //   }
  // }, [lastJsonMessage]);

  return touches;
}