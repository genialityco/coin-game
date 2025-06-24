// utils/simulateClick.js
export function simulateClickOnCanvas(canvas, game, x, y) {
  const rect = canvas.getBoundingClientRect();
  // Convertir coordenadas de juego a clientX/Y
  const clientX = rect.left + x * (rect.width  / game.scale.width);
  const clientY = rect.top  + y * (rect.height / game.scale.height);

  // pointerdown
  canvas.dispatchEvent(new PointerEvent('pointerdown', {
    clientX, clientY,
    pointerType: 'mouse',
    isPrimary: true,
    bubbles: true,
    button: 0
  }));
  // pointerup
  canvas.dispatchEvent(new PointerEvent('pointerup', {
    clientX, clientY,
    pointerType: 'mouse',
    isPrimary: true,
    bubbles: true,
    button: 0
  }));
}
