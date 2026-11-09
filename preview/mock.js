// Preview frame: drawn entirely by code (vector cel-shaded rig), no AI image generation.
const U = AF.U, cv = document.getElementById('c'), W = cv.width, H = cv.height, g = cv.getContext('2d');
const K = W / 1280; // design space is 1280x720

const D = {
  skin: '#ffe8da', skinSh: '#f3b7a6', hair: '#c93a6e', eye: '#f5a623',
  jacket: '#2a3166', trim: '#f2c14e', shirt: '#fbfbff', tie: '#e0454f', line: '#3a1c2e',
};
const P = { yaw: 0.28, pitch: -0.05, tilt: -5 };

function layer() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }

/* ---------------- background: academy rooftop at sunset ---------------- */
function background(c) {
  const r = U.rng(11);
  let s = c.createLinearGradient(0, 0, 0, 520);
  s.addColorStop(0, '#2a2c78'); s.addColorStop(0.35, '#8a4a9c'); s.addColorStop(0.62, '#f0708a');
  s.addColorStop(0.85, '#ffb46e'); s.addColorStop(1, '#ffe6a8');
  c.fillStyle = s; c.fillRect(0, 0, 1280, 720);
  // sun
  let sg = c.createRadialGradient(1010, 455, 0, 1010, 455, 420);
  sg.addColorStop(0, 'rgba(255,250,220,1)'); sg.addColorStop(0.08, 'rgba(255,236,170,.95)');
  sg.addColorStop(0.3, 'rgba(255,170,110,.45)'); sg.addColorStop(1, 'rgba(255,150,110,0)');
  c.fillStyle = sg; c.fillRect(0, 0, 1280, 720);
  // clouds: stacked puffs with lit undersides
  for (let k = 0; k < 9; k++) {
    const cx = r.range(-50, 1300), cy = r.range(60, 380), sc = r.range(0.6, 1.6);
    for (let pass = 0; pass < 2; pass++) {
      c.fillStyle = pass ? 'rgba(255,205,170,.9)' : 'rgba(150,90,150,.75)';
      const rr = U.rng(k * 31 + 5);
      for (let i = 0; i < 9; i++) {
        const x = cx + rr.range(-150, 150) * sc, y = cy + rr.range(-18, 18) * sc + (pass ? 9 * sc : 0);
        c.beginPath(); c.ellipse(x, y, rr.range(50, 105) * sc, rr.range(16, 30) * sc * (pass ? 0.7 : 1), 0, 0, 7); c.fill();
      }
    }
  }
  // distant city
  for (let pass = 0; pass < 2; pass++) {
    const rr = U.rng(pass + 77); let x = -20;
    c.fillStyle = pass ? '#4a2f63' : '#8a5383';
    while (x < 1300) {
      const w = rr.range(30, 80), h = rr.range(40, pass ? 120 : 170);
      c.fillRect(x, 520 - h + pass * 20, w, h + 60);
      if (pass) { c.fillStyle = '#ffd98a'; for (let i = 0; i < 6; i++) c.fillRect(x + rr.range(4, w - 8), 520 - h + 26 + rr.range(0, h - 20), 4, 5); c.fillStyle = '#4a2f63'; }
      x += w + rr.range(0, 14);
    }
  }
  // rooftop floor + fence
  let f = c.createLinearGradient(0, 540, 0, 720); f.addColorStop(0, '#6b4a70'); f.addColorStop(1, '#3b2c50');
  c.fillStyle = f; c.fillRect(0, 548, 1280, 180);
  c.fillStyle = 'rgba(255,190,120,.35)'; c.fillRect(0, 548, 1280, 5);
  c.strokeStyle = 'rgba(52,34,70,.55)'; c.lineWidth = 1.2;
  for (let x = -400; x < 1700; x += 16) { c.beginPath(); c.moveTo(x, 330); c.lineTo(x + 230, 560); c.moveTo(x, 330); c.lineTo(x - 230, 560); c.stroke(); }
  c.strokeStyle = '#3a2748'; c.lineWidth = 9;
  for (let x = 40; x < 1300; x += 240) { c.beginPath(); c.moveTo(x, 322); c.lineTo(x, 560); c.stroke(); }
  c.lineWidth = 7; c.beginPath(); c.moveTo(0, 326); c.lineTo(1280, 326); c.moveTo(0, 556); c.lineTo(1280, 556); c.stroke();
  c.strokeStyle = 'rgba(255,200,140,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 322.5); c.lineTo(1280, 322.5); c.stroke();
}

/* ---------------- character rig ---------------- */
const fx = P.yaw * 22, fy = P.pitch * 14;
function facePath(c) {
  const y = P.yaw, wl = 96 * (1 + 0.04 * y), wr = 96 * (1 - 0.09 * y), cx = y * 12;
  c.beginPath(); c.moveTo(-wl, -25);
  c.bezierCurveTo(-wl - 2, 38, -wl * 0.7, 90, cx - 13, 115);
  c.quadraticCurveTo(cx, 121, cx + 13, 115);
  c.bezierCurveTo(wr * 0.7, 90, wr + 2, 38, wr, -25);
  c.bezierCurveTo(wr, -135, -wl, -135, -wl, -25); c.closePath();
}
const yb = (x) => -88 + 30 * (x / 110) * (x / 110);
const BANGS = [[-114, -66, -106, 60], [-90, -40, -76, 4], [-60, -14, -46, 14], [-34, 20, -8, 31], [2, 52, 40, 12], [34, 86, 78, 2], [66, 114, 108, 58]]
  .map(([x0, x1, tx, ty]) => {
    const o = fx * 0.75, a = [x0 + o, yb(x0)], b = [x1 + o, yb(x1)], t = [tx + o * 1.15, ty];
    return { a, b, t, ca: [a[0] - 7 + (t[0] - a[0]) * 0.1, U.lerp(a[1], ty, 0.72)], cb: [b[0] + 9 + (t[0] - b[0]) * 0.1, U.lerp(b[1], ty, 0.6)] };
  });
function bangPath(c, k) { c.moveTo(k.a[0], k.a[1]); c.quadraticCurveTo(k.ca[0], k.ca[1], k.t[0], k.t[1]); c.quadraticCurveTo(k.cb[0], k.cb[1], k.b[0], k.b[1]); c.closePath(); }
function capPath(c) { const o = P.yaw * 5; c.moveTo(-111 + o, -4); c.bezierCurveTo(-124 + o, -164, 124 + o, -164, 111 + o, -4); c.quadraticCurveTo(o, -34, -111 + o, -4); c.closePath(); }
const TUFTS = [[-74, 26, -20], [-6, 38, 26], [70, 26, 20]];
function tuftPath(c, [ang, len, bend]) {
  const o = P.yaw * 5, p = (a, rx, ry) => { a = a * Math.PI / 180; return [o + Math.sin(a) * rx, -14 - Math.cos(a) * ry]; };
  const a = p(ang - 15, 100, 104), b = p(ang + 15, 100, 104), t = p(ang + bend, 108 + len, 112 + len), m = p(ang, 116, 120);
  c.moveTo(a[0], a[1]); c.quadraticCurveTo(U.lerp(a[0], m[0], 0.7), U.lerp(a[1], m[1], 0.7), t[0], t[1]);
  c.quadraticCurveTo(U.lerp(b[0], m[0], 1.1), U.lerp(b[1], m[1], 1.1), b[0], b[1]); c.closePath();
}
function lockPath(c, s) { // side lock in front of the ear
  const o = fx * 0.4;
  c.moveTo(s * 113 + o, -34); c.bezierCurveTo(s * 126 + o, 40, s * 112 + o, 96, s * 92 + o, 132);
  c.bezierCurveTo(s * 98 + o, 84, s * 90 + o, 30, s * 82 + o, -30); c.closePath();
}
function frontHairPaths(c) { c.beginPath(); capPath(c); TUFTS.forEach((t) => tuftPath(c, t)); BANGS.forEach((k) => bangPath(c, k)); lockPath(c, -1); lockPath(c, 1); }

function backHair(c) {
  const o = -P.yaw * 10, pts = [];
  c.beginPath(); c.moveTo(-112 + o, -40); c.bezierCurveTo(-140 + o, 20, -150 + o, 110, -132 + o, 196);
  const tips = [[-104, 150], [-84, 214], [-52, 168], [-26, 224], [8, 172], [40, 220], [70, 166], [100, 210], [124, 150], [140, 190]];
  tips.forEach(([x, y]) => c.lineTo(x + o, y));
  c.bezierCurveTo(152 + o, 110, 140 + o, 20, 112 + o, -40); c.closePath();
  const gr = c.createLinearGradient(0, -40, 0, 220); gr.addColorStop(0, U.shade(D.hair, -0.45)); gr.addColorStop(1, U.shade(D.hair, -0.2));
  c.fillStyle = gr; c.strokeStyle = D.line; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke(); c.fill();
}

function eye(c, x, y, hw, hh, side) {
  c.save(); c.translate(x, y); c.scale(side, 1);
  const shape = () => { c.beginPath(); c.moveTo(-hw, hh * 0.05); c.bezierCurveTo(-hw * 0.85, -hh * 1.02, hw * 0.75, -hh * 1.12, hw * 1.02, -hh * 0.22); c.bezierCurveTo(hw * 0.98, hh * 0.9, -hw * 0.7, hh * 1.02, -hw, hh * 0.05); c.closePath(); };
  c.save(); shape(); c.fillStyle = '#fff'; c.fill(); c.clip();
  // iris
  const ix = side * 3 + 1, iy = 2, irx = hw * 0.76, iry = hh * 0.98;
  const ig = c.createLinearGradient(0, -iry, 0, iry);
  ig.addColorStop(0, U.shade(D.eye, -0.72)); ig.addColorStop(0.45, U.shade(D.eye, -0.15)); ig.addColorStop(0.8, D.eye); ig.addColorStop(1, U.shade(D.eye, 0.55));
  c.beginPath(); c.ellipse(ix, iy, irx, iry, 0, 0, 7); c.fillStyle = ig; c.fill();
  c.lineWidth = 2.2; c.strokeStyle = U.shade(D.eye, -0.75); c.stroke();
  c.beginPath(); c.ellipse(ix, iy - 1, irx * 0.42, iry * 0.5, 0, 0, 7); c.fillStyle = U.shade(D.eye, -0.85); c.fill();
  // lower glow crescent
  c.beginPath(); c.ellipse(ix, iy + iry * 0.62, irx * 0.62, iry * 0.26, 0, 0, 7); c.fillStyle = U.rgba(U.shade(D.eye, 0.7), 0.75); c.fill();
  // lid shadow across the top of the eye
  c.fillStyle = 'rgba(60,30,70,.30)'; c.beginPath(); c.moveTo(-hw * 1.2, -hh * 1.3); c.lineTo(hw * 1.2, -hh * 1.3); c.lineTo(hw * 1.2, -hh * 0.5); c.quadraticCurveTo(0, -hh * 0.28, -hw * 1.2, -hh * 0.42); c.fill();
  // highlights (same world side on both eyes)
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ix - side * irx * 0.36, iy - iry * 0.46, irx * 0.3, iry * 0.22, -0.5 * side, 0, 7); c.fill();
  c.beginPath(); c.ellipse(ix + side * irx * 0.42, iy + iry * 0.38, irx * 0.13, iry * 0.1, 0, 0, 7); c.fill();
  c.restore();
  // upper lash: tapered filled stroke
  c.fillStyle = D.line; c.beginPath();
  c.moveTo(-hw * 1.06, hh * 0.1); c.bezierCurveTo(-hw * 0.9, -hh * 1.06, hw * 0.75, -hh * 1.2, hw * 1.06, -hh * 0.3);
  c.lineTo(hw * 1.34, -hh * 0.5); c.lineTo(hw * 1.12, -hh * 0.06); c.lineTo(hw * 1.0, -hh * 0.2);
  c.bezierCurveTo(hw * 0.7, -hh * 0.98, -hw * 0.8, -hh * 0.88, -hw * 0.98, hh * 0.1); c.closePath(); c.fill();
  // lower lid + crease
  c.strokeStyle = D.line; c.lineCap = 'round'; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(hw * 0.9, hh * 0.5); c.quadraticCurveTo(hw * 0.45, hh * 1.0, -hw * 0.2, hh * 1.0); c.stroke();
  c.strokeStyle = U.rgba(D.line, 0.45); c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-hw * 0.6, -hh * 1.22); c.quadraticCurveTo(hw * 0.2, -hh * 1.42, hw * 0.9, -hh * 1.0); c.stroke();
  c.restore();
}

function body(c) {
  c.save(); c.translate(0, 124); c.scale(1.24, 1.24); c.lineJoin = 'round'; c.lineCap = 'round';
  const sw = 102;
  const arm = (s) => { // capsule sleeve
    [[D.line, 50], [D.jacket, 44]].forEach(([col, w]) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(s * (sw - 6), 62); c.lineTo(s * (sw + 12), 330); c.stroke(); });
    c.strokeStyle = U.rgba('#0c0f33', 0.5); c.lineWidth = 9; c.beginPath(); c.moveTo(s * (sw - 22), 86); c.lineTo(s * (sw - 8), 330); c.stroke();
  };
  arm(-1); arm(1);
  const torso = () => { c.beginPath(); c.moveTo(-26, -4); c.quadraticCurveTo(-46, 20, -sw, 30); c.quadraticCurveTo(-sw - 20, 40, -sw - 12, 86); c.lineTo(-sw + 16, 330); c.lineTo(sw - 16, 330); c.lineTo(sw + 12, 86); c.quadraticCurveTo(sw + 20, 40, sw, 30); c.quadraticCurveTo(46, 20, 26, -4); c.closePath(); };
  torso(); c.fillStyle = D.jacket; c.strokeStyle = D.line; c.lineWidth = 3; c.stroke(); c.fill();
  c.save(); torso(); c.clip();
  // shirt V
  c.fillStyle = D.shirt; c.beginPath(); c.moveTo(-34, -10); c.lineTo(0, 150); c.lineTo(34, -10); c.closePath(); c.fill();
  c.fillStyle = 'rgba(120,130,200,.28)'; c.beginPath(); c.moveTo(-34, -10); c.lineTo(34, -10); c.lineTo(22, 40); c.quadraticCurveTo(0, 22, -24, 34); c.closePath(); c.fill();
  // jacket shadow side
  c.fillStyle = 'rgba(8,10,50,.42)'; c.beginPath(); c.moveTo(-140, 0); c.lineTo(-60, 30); c.quadraticCurveTo(-78, 180, -52, 340); c.lineTo(-140, 340); c.fill();
  c.beginPath(); c.moveTo(-70, 0); c.quadraticCurveTo(0, 60, 80, 6); c.lineTo(60, -20); c.lineTo(-60, -20); c.fill();
  // lapels with gold trim
  [-1, 1].forEach((s) => {
    c.beginPath(); c.moveTo(s * 30, -8); c.lineTo(s * 4, 150); c.lineTo(s * 30, 118); c.lineTo(s * 64, 22); c.closePath();
    c.fillStyle = U.shade(D.jacket, 0.08); c.fill(); c.strokeStyle = D.line; c.lineWidth = 2.5; c.stroke();
    c.strokeStyle = D.trim; c.lineWidth = 4; c.beginPath(); c.moveTo(s * 61, 26); c.lineTo(s * 30, 113); c.stroke();
  });
  // shirt collar
  [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(s * 24, -10); c.lineTo(s * 42, 30); c.lineTo(s * 6, 38); c.lineTo(s * 2, 14); c.closePath(); c.fillStyle = D.shirt; c.fill(); c.strokeStyle = D.line; c.lineWidth = 2.2; c.stroke(); });
  // ribbon
  c.fillStyle = D.tie; c.strokeStyle = D.line; c.lineWidth = 2.2;
  [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(0, 30); c.quadraticCurveTo(s * 26, 8, s * 44, 22); c.quadraticCurveTo(s * 40, 50, s * 46, 62); c.quadraticCurveTo(s * 20, 54, 0, 38); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(s * 2, 40); c.lineTo(s * 20, 96); c.lineTo(s * 6, 88); c.lineTo(0, 46); c.closePath(); c.fill(); c.stroke(); });
  c.beginPath(); c.ellipse(0, 34, 8, 9, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = D.trim; c.beginPath(); c.arc(0, 184, 7, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(0, 236, 7, 0, 7); c.fill(); c.stroke();
  c.restore();
  c.restore();
}

function character(c) {
  c.lineJoin = 'round'; c.lineCap = 'round';
  backHair(c);
  body(c);
  // neck
  c.fillStyle = D.skin; c.strokeStyle = D.line; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-27, 84); c.lineTo(-29, 138); c.quadraticCurveTo(0, 152, 29, 138); c.lineTo(27, 84); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-28, 100); c.lineTo(-29, 132); c.moveTo(28, 100); c.lineTo(29, 132); c.stroke();
  c.save(); c.beginPath(); c.rect(-30, 84, 60, 70); c.clip(); c.fillStyle = D.skinSh; c.beginPath(); c.ellipse(P.yaw * 14, 100, 46, 30, 0, 0, 7); c.fill(); c.restore();

  // head (tilted)
  c.save(); c.translate(0, 60); c.rotate(P.tilt * Math.PI / 180); c.translate(0, -60);
  facePath(c); c.fillStyle = D.skin; c.fill();
  // shadows on the face: under the fringe + far cheek
  c.save(); facePath(c); c.clip();
  c.fillStyle = D.skinSh; c.translate(3, 12); c.beginPath(); BANGS.forEach((k) => bangPath(c, k)); capPath(c); lockPath(c, -1); lockPath(c, 1); c.fill();
  c.restore();
  facePath(c); c.strokeStyle = D.line; c.lineWidth = 3; c.stroke();
  // blush
  [-1, 1].forEach((s) => { const bx = s * 54 + fx, by = 58 + fy; const bg = c.createRadialGradient(bx, by, 0, bx, by, 26); bg.addColorStop(0, 'rgba(255,110,120,.45)'); bg.addColorStop(1, 'rgba(255,110,120,0)'); c.fillStyle = bg; c.beginPath(); c.ellipse(bx, by, 28, 16, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(230,90,110,.6)'; c.lineWidth = 1.6; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(bx + i * 8 + 3, by - 5); c.lineTo(bx + i * 8 - 3, by + 5); c.stroke(); } });
  // eyes
  c.save(); c.globalAlpha = 1; eye(c, -47 + fx, 27 + fy, 27, 35, -1);
  eye(c, 45 + fx * 0.82, 27 + fy, 27 * (1 - 0.2 * P.yaw), 35, 1); c.restore();
  // nose
  c.strokeStyle = U.rgba(D.line, 0.8); c.lineWidth = 2; c.beginPath(); c.moveTo(fx * 1.3 + 2, 58 + fy); c.lineTo(fx * 1.3 + 6, 63 + fy); c.stroke();
  // mouth: open happy
  const mx = fx * 0.95, my = 80 + fy, mw = 19;
  const mouth = () => { c.beginPath(); c.moveTo(mx - mw, my); c.quadraticCurveTo(mx, my - 3, mx + mw, my); c.bezierCurveTo(mx + mw * 0.85, my + 27, mx - mw * 0.85, my + 27, mx - mw, my); c.closePath(); };
  mouth(); c.fillStyle = '#8c2638'; c.fill();
  c.save(); mouth(); c.clip(); c.fillStyle = '#f08a96'; c.beginPath(); c.ellipse(mx, my + 23, 13, 9, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillRect(mx - mw, my - 4, mw * 2, 7.5); c.restore();
  mouth(); c.strokeStyle = D.line; c.lineWidth = 2.4; c.stroke();

  // front hair: outline pass, fill pass, inner strand lines, gradient + highlight
  frontHairPaths(c); c.strokeStyle = D.line; c.lineWidth = 6; c.stroke();
  frontHairPaths(c); c.fillStyle = D.hair; c.fill();
  c.save(); frontHairPaths(c); c.clip();
  const hg = c.createLinearGradient(0, -120, 0, 130); hg.addColorStop(0, U.rgba(U.shade(D.hair, -0.5), 0.55)); hg.addColorStop(0.35, U.rgba(D.hair, 0)); hg.addColorStop(1, U.rgba(U.shade(D.hair, 0.5), 0.55));
  c.fillStyle = hg; c.fillRect(-170, -170, 340, 340);
  // angel-ring highlight
  c.strokeStyle = U.rgba(U.shade(D.hair, -0.55), 0.5); c.lineWidth = 1.6;
  [[-70, -60], [-36, -84], [-4, -90], [34, -84], [66, -62]].forEach(([x, y], i) => { c.beginPath(); c.moveTo(-6 + fx * 0.3 + i * 3, -122); c.quadraticCurveTo(x * 0.8 + fx * 0.5, -112, x + fx * 0.7, y + 46); c.stroke(); });
  c.fillStyle = U.rgba(U.shade(D.hair, 0.62), 0.7); c.beginPath();
  const top = (x) => -62 - 34 * Math.cos((x - fx) / 104 * 1.25);
  for (let x = -96; x <= 96; x += 8) c.lineTo(x + fx * 0.5, top(x));
  for (let x = 96, i = 0; x >= -96; x -= 12, i++) c.lineTo(x + fx * 0.5, top(x) + (i % 2 ? 4 : 13));
  c.closePath(); c.fill();
  c.restore();
  c.strokeStyle = D.line; c.lineWidth = 2.2;
  BANGS.forEach((k) => { [[k.a, k.ca], [k.b, k.cb]].forEach(([p, q]) => { const s = U.qpt(p, q, k.t, 0.42), cc = U.lp(q, k.t, 0.42); c.beginPath(); c.moveTo(s[0], s[1]); c.quadraticCurveTo(cc[0], cc[1], k.t[0], k.t[1]); c.stroke(); }); });
  // brows drawn over the fringe (anime convention)
  c.strokeStyle = U.shade(D.hair, -0.5); c.lineWidth = 4;
  c.beginPath(); c.moveTo(-70 + fx, -19 + fy); c.quadraticCurveTo(-46 + fx, -30 + fy, -22 + fx, -22 + fy); c.stroke();
  c.beginPath(); c.moveTo(22 + fx, -22 + fy); c.quadraticCurveTo(44 + fx, -30 + fy, 64 + fx, -19 + fy); c.stroke();
  c.restore();
}

function star(c, x, y, r, a) { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.16 : r, t = i * Math.PI / 4; c.lineTo(Math.cos(t) * rr, Math.sin(t) * rr); } c.closePath(); c.fill(); c.restore(); }

/* ---------------- compose the frame ---------------- */
const bg = layer(), b = bg.getContext('2d'); b.scale(K, K); background(b);
g.filter = `blur(${5 * K}px)`; g.drawImage(bg, -40 * K, -30 * K, W + 80 * K, H + 60 * K); g.filter = 'none';

const ch = layer(), c = ch.getContext('2d');
c.scale(K, K); c.translate(560, 300); c.scale(1.42, 1.42); character(c);
c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop';
let rim = c.createLinearGradient(W * 0.3, 0, W * 0.78, 0); rim.addColorStop(0, 'rgba(90,50,140,.20)'); rim.addColorStop(0.55, 'rgba(255,170,110,.06)'); rim.addColorStop(1, 'rgba(255,190,110,.55)');
c.fillStyle = rim; c.fillRect(0, 0, W, H);
g.save(); g.shadowColor = 'rgba(255,190,130,.55)'; g.shadowBlur = 26 * K; g.drawImage(ch, 0, 0); g.restore();

g.scale(K, K);
// bloom from the sun + sparkles
g.globalCompositeOperation = 'screen';
let bl = g.createRadialGradient(1060, 430, 0, 1060, 430, 620); bl.addColorStop(0, 'rgba(255,200,140,.55)'); bl.addColorStop(1, 'rgba(255,160,120,0)'); g.fillStyle = bl; g.fillRect(0, 0, 1280, 720);
const rs = U.rng(4);
for (let i = 0; i < 26; i++) { const x = rs.range(140, 1180), y = rs.range(40, 620), r = rs.range(5, 22); g.fillStyle = `rgba(255,${200 + rs.int(0, 55)},${170 + rs.int(0, 80)},${rs.range(0.5, 1)})`; star(g, x, y, r, rs.range(0, 1)); }
g.globalCompositeOperation = 'source-over';
// vignette
let v = g.createRadialGradient(640, 340, 300, 640, 360, 820); v.addColorStop(0, 'rgba(20,5,40,0)'); v.addColorStop(1, 'rgba(20,5,40,.55)'); g.fillStyle = v; g.fillRect(0, 0, 1280, 720);
// subtitle
g.textAlign = 'center'; g.lineJoin = 'round';
g.font = '700 22px system-ui, sans-serif'; g.lineWidth = 6; g.strokeStyle = 'rgba(40,10,40,.9)'; g.strokeText('Kairi', 640, 610); g.fillStyle = '#ff9dbb'; g.fillText('Kairi', 640, 610);
g.font = '700 34px system-ui, sans-serif'; g.lineWidth = 8; g.strokeText("I'm going to master every spell there is!", 640, 654); g.fillStyle = '#fff'; g.fillText("I'm going to master every spell there is!", 640, 654);
