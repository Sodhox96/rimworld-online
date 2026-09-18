/**
 * 2D Simplex/Perlin Noise Implementation for Procedural World Generation
 */

export class SimplexNoise {
  private perm: number[] = [];
  private grad3: number[][] = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
  ];

  constructor(seed: number = 1337) {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    // Seeded shuffle (LCG)
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) % 4294967296;
      const j = Math.floor((s / 4294967296) * (i + 1));
      const temp = p[i];
      p[i] = p[j];
      p[j] = temp;
    }
    // Duplicate to avoid overflow
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }

  private dot(g: number[], x: number, y: number): number {
    return g[0] * x + g[1] * y;
  }

  public noise2D(xin: number, yin: number): number {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

    let n0: number, n1: number, n2: number;

    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;

    let i1: number, j1: number;
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;

    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.perm[ii + this.perm[jj]] % 12;
    const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
    const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
    }

    // Result is in range [-1, 1], normalize to [0, 1]
    return 35.0 * (n0 + n1 + n2) * 0.5 + 0.5;
  }

  // Fractal Brownian Motion (Octaves)
  public fbm2D(x: number, y: number, octaves: number = 4, persistence: number = 0.5, lacunarity: number = 2.0): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }
}

// Global instances for deterministic terrain and mineral clusters
export const elevationNoise = new SimplexNoise(42069);
export const moistureNoise = new SimplexNoise(88412);
export const mineralNoise = new SimplexNoise(31415);
export const plantDensityNoise = new SimplexNoise(77123);
