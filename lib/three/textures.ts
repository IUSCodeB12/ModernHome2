import * as THREE from "three";

/**
 * Procedurally generated PBR-ish textures drawn on a canvas — no external
 * assets, no network. Cached at module scope so the two canvases (hero +
 * tour) share one GPU upload each. Client-only (guarded for SSR, though the
 * room components are always dynamically imported with ssr:false).
 */

let marbleTex: THREE.CanvasTexture | null = null;
let woodTex: THREE.CanvasTexture | null = null;
let chevronTex: THREE.CanvasTexture | null = null;

function canDraw(): boolean {
  return typeof document !== "undefined";
}

/** Warm Calacatta-style marble: soft cloudy base with grey branching veins. */
export function getMarbleTexture(): THREE.Texture | null {
  if (!canDraw()) return null;
  if (marbleTex) return marbleTex;

  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;

  // Warm off-white base
  ctx.fillStyle = "#f3efe8";
  ctx.fillRect(0, 0, size, size);

  // Soft grey clouds for depth
  for (let i = 0; i < 7; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 80 + Math.random() * 160;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(198,193,186,0.28)");
    g.addColorStop(1, "rgba(198,193,186,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  // Veins: random-walk strokes with faint branches. `angle` biases the
  // overall flow so veins read as diagonal marble movement, not vertical rain.
  const drawVein = (
    startX: number,
    width: number,
    alpha: number,
    rgb: string,
    drift: number
  ) => {
    ctx.strokeStyle = `rgba(${rgb},${alpha})`;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    let x = startX;
    let y = -10;
    ctx.moveTo(x, y);
    while (y < size + 10) {
      x += drift + (Math.random() - 0.5) * 42;
      y += 12 + Math.random() * 18;
      ctx.lineTo(x + (Math.random() - 0.5) * 22, y);
    }
    ctx.stroke();
  };

  // Primary greys + fine secondary hairlines branching off them.
  for (let v = 0; v < 9; v++) {
    const sx = Math.random() * size;
    const drift = (Math.random() - 0.5) * 20;
    drawVein(sx, 1.2 + Math.random() * 2.6, 0.26 + Math.random() * 0.22, "70,66,62", drift);
    drawVein(sx + (Math.random() - 0.5) * 70, 0.5, 0.12, "90,86,82", drift * 0.7);
    drawVein(sx + (Math.random() - 0.5) * 40, 0.35, 0.08, "110,106,102", drift);
  }
  // A few faint warm-gold veins for the luxe Calacatta feel.
  for (let v = 0; v < 3; v++) {
    drawVein(Math.random() * size, 0.8, 0.14, "170,132,60", (Math.random() - 0.5) * 24);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  marbleTex = tex;
  return tex;
}

/** Woven chevron pattern for accent cushions. */
export function getChevronTexture(): THREE.Texture | null {
  if (!canDraw()) return null;
  if (chevronTex) return chevronTex;

  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#b8a58a";
  ctx.fillRect(0, 0, s, s);

  const step = 16;
  ctx.lineWidth = 5;
  ctx.lineCap = "square";
  for (let row = -1, r = 0; r < s + step; r += step, row++) {
    ctx.strokeStyle = row % 2 === 0 ? "rgba(120,105,85,0.55)" : "rgba(215,203,183,0.6)";
    ctx.beginPath();
    for (let x = 0; x <= s + step; x += step) {
      const y = r + (Math.floor(x / step) % 2 === 0 ? 0 : step);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  chevronTex = tex;
  return tex;
}

/** Warm oak wood grain (vertical), for the slat feature panel. */
export function getWoodTexture(): THREE.Texture | null {
  if (!canDraw()) return null;
  if (woodTex) return woodTex;

  const w = 128;
  const h = 512;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#8a6a45";
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 90; i++) {
    const x = Math.random() * w;
    const rr = 60 + (Math.random() * 40) | 0;
    const gg = 42 + (Math.random() * 28) | 0;
    const bb = 26 + (Math.random() * 18) | 0;
    ctx.strokeStyle = `rgba(${rr},${gg},${bb},${0.12 + Math.random() * 0.22})`;
    ctx.lineWidth = 0.8 + Math.random() * 1.8;
    ctx.beginPath();
    let xx = x;
    ctx.moveTo(xx, 0);
    for (let y = 0; y < h; y += 18) {
      xx += (Math.random() - 0.5) * 3;
      ctx.lineTo(xx, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  woodTex = tex;
  return tex;
}
