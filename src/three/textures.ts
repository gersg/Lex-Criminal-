import * as THREE from 'three';

export function createObservatoryFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Deep midnight slate base
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, size, size);

    // Subtle radial gradient at center
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      20,
      size / 2,
      size / 2,
      size * 0.48
    );
    grad.addColorStop(0, 'rgba(217, 119, 6, 0.11)');
    grad.addColorStop(0.55, 'rgba(30, 41, 59, 0.12)');
    grad.addColorStop(1, 'rgba(7, 11, 20, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Fine architectural grid lines
    const step = 32;
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.28)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    // Major crosshairs & compass ticks
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size / 2, 32);
    ctx.lineTo(size / 2, size - 32);
    ctx.moveTo(32, size / 2);
    ctx.lineTo(size - 32, size / 2);
    ctx.stroke();

    // Concentric architectural rings
    const radii = [120, 240, 360, 460];
    radii.forEach((r, idx) => {
      ctx.strokeStyle =
        idx % 2 === 0 ? 'rgba(245, 158, 11, 0.22)' : 'rgba(56, 189, 248, 0.16)';
      ctx.lineWidth = idx === 1 ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.max(1, maxAnisotropy);
  texture.needsUpdate = true;
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      10,
      size / 2,
      size / 2,
      size / 2
    );
    grad.addColorStop(0, 'rgba(2, 6, 14, 0.85)');
    grad.addColorStop(0.5, 'rgba(2, 6, 14, 0.42)');
    grad.addColorStop(1, 'rgba(2, 6, 14, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
