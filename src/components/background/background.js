// Animated digital-art background: floating to-do icons, drifting particles,
// connecting lines and animated mini bar-charts on a canvas.

const ICONS = ['\u2713', '\u2611', '\u25A1', '\u2691', '\u2605', '\u23F1', '\u2261'];
const COLORS = ['#6d8cff', '#b06dff', '#28e0c8', '#8aa0ff'];

let ctx;
let canvas;
let width = 0;
let height = 0;
let dpr = 1;
let nodes = [];
let charts = [];
let rafId = null;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function buildScene() {
  const nodeCount = Math.round((width * height) / 28000);
  nodes = Array.from({ length: Math.max(28, nodeCount) }, () => ({
    x: rand(0, width),
    y: rand(0, height),
    vx: rand(-0.25, 0.25),
    vy: rand(-0.25, 0.25),
    r: rand(1.2, 2.8),
    icon: Math.random() > 0.55 ? pick(ICONS) : null,
    size: rand(12, 22),
    color: pick(COLORS),
    spin: rand(-0.01, 0.01),
    angle: rand(0, Math.PI * 2),
  }));

  charts = Array.from({ length: 4 }, () => ({
    x: rand(width * 0.1, width * 0.9),
    y: rand(height * 0.15, height * 0.85),
    bars: Array.from({ length: 5 }, () => rand(0.2, 1)),
    phase: rand(0, Math.PI * 2),
    color: pick(COLORS),
    bw: rand(6, 10),
  }));
}

function drawLines() {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 130) {
        ctx.globalAlpha = (1 - dist / 130) * 0.18;
        ctx.strokeStyle = '#7c8cff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

function drawNodes() {
  nodes.forEach((n) => {
    n.x += n.vx;
    n.y += n.vy;
    n.angle += n.spin;

    if (n.x < -30) n.x = width + 30;
    if (n.x > width + 30) n.x = -30;
    if (n.y < -30) n.y = height + 30;
    if (n.y > height + 30) n.y = -30;

    if (n.icon) {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(Math.sin(n.angle) * 0.3);
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = n.color;
      ctx.font = `${n.size}px 'Space Grotesk', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.icon, 0, 0);
      ctx.restore();
    } else {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
}

function drawCharts(t) {
  charts.forEach((c) => {
    const maxH = 46;
    c.bars.forEach((base, i) => {
      const h = (0.5 + 0.5 * Math.sin(t * 0.002 + c.phase + i)) * maxH * base + 6;
      const x = c.x + i * (c.bw + 4);
      const y = c.y - h;
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = c.color;
      const r = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.arcTo(x + c.bw, y, x + c.bw, y + r, r);
      ctx.lineTo(x + c.bw, c.y);
      ctx.lineTo(x, c.y);
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c.x - 4, c.y);
    ctx.lineTo(c.x + c.bars.length * (c.bw + 4), c.y);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

function frame(t) {
  ctx.clearRect(0, 0, width, height);
  drawLines();
  drawCharts(t);
  drawNodes();
  rafId = requestAnimationFrame(frame);
}

export function initBackground() {
  canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  resize();
  buildScene();

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(frame);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      buildScene();
    }, 200);
  });
}
