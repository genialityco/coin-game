// hooks/useTouchRegions.ts
import { useEffect, useState } from 'react';
import type { TouchPoint } from './useTouchPoints';

export interface TouchRegion {
  id: string;
  x: number; // center
  y: number;
  width: number;
  height: number;
}

export interface RegionState {
  id: string;
  isTouched: boolean;
}

export function useTouchRegions(touchPoints: TouchPoint[], regions: TouchRegion[]) {
  const [state, setState] = useState<Record<string, RegionState>>({});

  useEffect(() => {
    const newState: Record<string, RegionState> = {};

    for (const region of regions) {
      const left = region.x - region.width / 2;
      const right = region.x + region.width / 2;
      const top = region.y - region.height / 2;
      const bottom = region.y + region.height / 2;

      const isTouched = touchPoints.some((pt) => {
        const x = window.innerWidth - (pt['2d_x_px'] / 640) * window.innerWidth;
        const y = (pt['2d_y_px'] / 480) * window.innerHeight;

       // return pt.is_touching && x >= left && x <= right && y >= top && y <= bottom;
       return x >= left && x <= right && y >= top && y <= bottom;
      });

      newState[region.id] = {
        id: region.id,
        isTouched,
      };
    }

    setState(newState);
  }, [touchPoints, regions]);

  return state;
}
