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
}

export function useTouchPoints(): TouchPoint[] {
  const [touches, setTouches] = useState<TouchPoint[]>([]);

  const { lastJsonMessage } = useWebSocket('ws://localhost:8000/ws/touches', {
    share: true,
    shouldReconnect: () => true,
  });

  useEffect(() => {
    if (lastJsonMessage && Array.isArray(lastJsonMessage)) {
      setTouches(lastJsonMessage);
    }
  }, [lastJsonMessage]);

  return touches;
}