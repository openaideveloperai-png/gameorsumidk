// AniForge — shared helpers (math, colour, seeded randomness)
window.AF = window.AF || {};
(function (AF) {
  const U = (AF.U = {});

  U.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.smooth = (t) => { t = U.clamp(t); return t * t * (3 - 2 * t); };
  U.easeOut = (t) => 1 - Math.pow(1 - U.clamp(t), 3);
  U.easeIn = (t) => Math.pow(U.clamp(t), 3);
  U.easeOutBack = (t) => { t = U.clamp(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  U.TAU = Math.PI * 2;

  // FNV-1a string hash -> uint32
  U.hash = (str) => {
    let h = 2166136261;
    str = String(str);
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  // mulberry32 seeded PRNG
  U.rng = (seed) => {
    let a = (typeof seed === 'string' ? U.hash(seed) : seed) >>> 0;
    const f = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.range = (lo, hi) => lo + (hi - lo) * f();
    f.int = (lo, hi) => Math.floor(f.range(lo, hi + 1));
    f.pick = (arr) => arr[Math.floor(f() * arr.length)];
    f.chance = (p) => f() < p;
    return f;
  };

  // Deterministic value noise in 1D: smooth, range -1..1
  U.noise = (t, seed = 0) => {
    const i = Math.floor(t), f = t - i;
    const r = (n) => ((Math.imul((n + seed * 7919) | 0, 2654435761) >>> 0) / 2147483648) - 1;
    return U.lerp(r(i), r(i + 1), f * f * (3 - 2 * f));
  };

  U.hexToRgb = (hex) => {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.rgbToHex = (r, g, b) =>
    '#' + [r, g, b].map((v) => Math.round(U.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  U.mix = (a, b, t) => {
    const A = U.hexToRgb(a), B = U.hexToRgb(b);
    return U.rgbToHex(U.lerp(A[0], B[0], t), U.lerp(A[1], B[1], t), U.lerp(A[2], B[2], t));
  };
  // amt < 0 darkens (towards a cool dark, like cel shadows), amt > 0 lightens
  U.shade = (hex, amt) => (amt < 0 ? U.mix(hex, '#1a1030', -amt) : U.mix(hex, '#ffffff', amt));
  U.rgba = (hex, a) => { const c = U.hexToRgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  U.hsl = (h, s, l) => {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return U.rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
  };

  // Quadratic bezier helpers (points are [x,y])
  U.qpt = (a, c, b, t) => {
    const m = 1 - t;
    return [m * m * a[0] + 2 * m * t * c[0] + t * t * b[0], m * m * a[1] + 2 * m * t * c[1] + t * t * b[1]];
  };
  U.lp = (a, b, t) => [U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t)];

  U.fmtTime = (s) => {
    s = Math.max(0, s);
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  };
})(window.AF);
