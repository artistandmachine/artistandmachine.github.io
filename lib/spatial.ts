/**
 * "Spatial scene" hover for the Work tiles, like Apple Photos' Spatial
 * Scenes: each photo has a precomputed depth map (scripts/build-depth.mjs,
 * brighter = nearer), and a WebGL shader shifts every pixel by its depth as
 * the cursor moves, so near things swing toward the cursor and far things
 * away. It steps through the depth layers (parallax occlusion) so near
 * surfaces overlap far ones instead of smearing.
 *
 * Browsers cap live WebGL contexts (~16), so there is ONE canvas for the
 * whole page. It moves into whichever tile is hovered, renders while the
 * cursor is there and while the spring settles after it leaves, then
 * detaches. At rest the shader output is identical to the plain photo
 * (same object-cover crop, no zoom), so attaching and detaching never jump.
 *
 * Driven from components/Media.tsx. Touch devices and reduced motion never
 * call in (see `spatialSupported`).
 */

import { tune } from "@/lib/tune";

export type SpatialOptions = {
  /** How far the scene shifts at the edge, as a fraction of the image. */
  strength: number;
  /** Depth that stays still (0 = farthest, 1 = nearest). */
  focus: number;
};

// Strengths and focus are set in lib/tune.ts (tune.spatial).
/** Work tiles (the default). */
export const SPATIAL_TILE: SpatialOptions = tune.spatial.tile;
/** Hero carousel default: subtler, pinned on the nearest plane so the
 * backdrop drifts behind a steady subject. */
export const SPATIAL_HERO: SpatialOptions = tune.spatial.hero;
/** Per-slide hero settings, in carousel order. A slide with no entry
 * uses SPATIAL_HERO. */
export const SPATIAL_HERO_SLIDES: SpatialOptions[] = tune.spatial.heroSlides;

/** `/images/x/name.jpg` -> `/images/x/name-depth.webp` (build-depth.mjs). */
export const depthSrc = (src: string) => src.replace(/\.[a-z0-9]+$/i, "-depth.webp");

export function spatialSupported() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const VERT = `
attribute vec2 p;
varying vec2 uv;
void main() { uv = p * 0.5 + 0.5; uv.y = 1.0 - uv.y; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
varying vec2 uv;
uniform sampler2D img;
uniform sampler2D depth;
uniform vec2 cover;   // object-cover: visible fraction of the image per axis
uniform vec2 offset;  // cursor, -1..1 per axis
uniform float strength;
uniform float focus;
uniform float zoom;
void main() {
  vec2 base = ((uv - 0.5) / zoom) * cover + 0.5;
  vec2 dir = offset * strength;
  vec2 hit = base - dir * (texture2D(depth, base).r - focus);
  const int STEPS = 24;
  for (int i = 0; i < STEPS; i++) {
    float layer = 1.0 - float(i) / float(STEPS - 1);
    vec2 s = base - dir * (layer - focus);
    if (texture2D(depth, s).r >= layer) { hit = s; break; }
  }
  gl_FragColor = texture2D(img, hit);
}`;

type Pair = { img: WebGLTexture; depth: WebGLTexture; aspect: number };

// Spring (same feel as lib/useMagnet's MOVE_SPRING) and hover easing.
const { stiffness: STIFFNESS, damping: DAMPING } = tune.spatial.spring;

class SpatialRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private cache = new Map<string, Promise<Pair | null>>();

  private host: HTMLElement | null = null;
  private pair: Pair | null = null;
  private opts: SpatialOptions = SPATIAL_TILE;
  private token = 0;
  private hovering = false;
  private target = { x: 0, y: 0 };
  private pos = { x: 0, y: 0 };
  private vel = { x: 0, y: 0 };
  /** 0 -> 1 while hovered; scales the overscan zoom so rest == plain photo. */
  private hover = 0;
  private hoverVel = 0;
  private raf = 0;
  private last = 0;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute("aria-hidden", "true");
    Object.assign(this.canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      opacity: "0",
      transition: "opacity 150ms ease-out",
    });
    const gl = this.canvas.getContext("webgl", { premultipliedAlpha: false, antialias: false });
    if (!gl) throw new Error("WebGL unavailable");
    this.gl = gl;

    const prog = gl.createProgram()!;
    for (const [type, src] of [
      [gl.VERTEX_SHADER, VERT],
      [gl.FRAGMENT_SHADER, FRAG],
    ] as const) {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      gl.attachShader(prog, s);
    }
    gl.linkProgram(prog);
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    for (const n of ["img", "depth", "cover", "offset", "strength", "focus", "zoom"]) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }
    gl.uniform1i(this.u.img, 0);
    gl.uniform1i(this.u.depth, 1);
  }

  private texture(src: string) {
    return new Promise<{ tex: WebGLTexture; aspect: number } | null>((resolve) => {
      const im = new Image();
      im.decoding = "async";
      im.onload = () => {
        const gl = this.gl;
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        resolve({ tex, aspect: im.naturalWidth / im.naturalHeight });
      };
      im.onerror = () => resolve(null);
      im.src = src;
    });
  }

  /** Photo + depth textures, loaded once per src. Null when either is missing. */
  private load(src: string) {
    let p = this.cache.get(src);
    if (!p) {
      p = Promise.all([this.texture(src), this.texture(depthSrc(src))]).then(([img, depth]) =>
        img && depth ? { img: img.tex, depth: depth.tex, aspect: img.aspect } : null
      );
      this.cache.set(src, p);
    }
    return p;
  }

  /**
   * Start (or continue) rendering `src` inside `host`. Coming from rest, or
   * from a different tile, the spring starts at rest. Switching host while
   * still hovering (the Hero carousel rotating under the cursor) keeps the
   * current position, so the new slide picks up exactly where the old one was.
   */
  async enter(host: HTMLElement, src: string, opts: SpatialOptions = SPATIAL_TILE) {
    const token = ++this.token;
    const continuing = this.hovering;
    this.hovering = true;
    if (this.host !== host && !continuing) {
      this.pos = { x: 0, y: 0 };
      this.vel = { x: 0, y: 0 };
      this.hover = 0;
      this.hoverVel = 0;
      this.canvas.style.opacity = "0";
    }
    const pair = await this.load(src);
    if (!pair || token !== this.token) return;
    this.pair = pair;
    this.opts = opts;
    this.host = host;
    if (this.canvas.parentElement !== host) host.appendChild(this.canvas);
    this.start();
  }

  move(nx: number, ny: number) {
    this.target = { x: nx, y: ny };
  }

  leave() {
    this.hovering = false;
    this.target = { x: 0, y: 0 };
  }

  private start() {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    const dt = Math.min((now - this.last) / 1000, 1 / 30);
    this.last = now;

    for (const a of ["x", "y"] as const) {
      this.vel[a] += (STIFFNESS * (this.target[a] - this.pos[a]) - DAMPING * this.vel[a]) * dt;
      this.pos[a] += this.vel[a] * dt;
    }
    const h = this.hovering ? 1 : 0;
    this.hoverVel += (40 * (h - this.hover) - 22 * this.hoverVel) * dt;
    this.hover += this.hoverVel * dt;

    this.draw();

    const settled =
      !this.hovering &&
      Math.abs(this.pos.x) + Math.abs(this.pos.y) + Math.abs(this.vel.x) + Math.abs(this.vel.y) < 0.002 &&
      Math.abs(this.hover) < 0.002;
    if (settled) {
      this.raf = 0;
      this.canvas.style.opacity = "0";
      this.canvas.remove();
      this.host = null;
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private draw() {
    const { gl, canvas, host, pair } = this;
    if (!host || !pair) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(host.clientWidth * dpr);
    const h = Math.round(host.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    // object-cover: crop whichever axis overflows.
    const box = w / h;
    gl.uniform2f(this.u.cover, pair.aspect > box ? box / pair.aspect : 1, pair.aspect > box ? 1 : pair.aspect / box);
    gl.uniform2f(this.u.offset, this.pos.x, this.pos.y);
    // Overscan just enough that displaced pixels never pull in the border;
    // zero at rest so the canvas matches the plain photo exactly.
    gl.uniform1f(this.u.strength, this.opts.strength);
    gl.uniform1f(this.u.focus, this.opts.focus);
    gl.uniform1f(this.u.zoom, 1 + this.opts.strength * 1.5 * Math.max(0, this.hover));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pair.img);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, pair.depth);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    canvas.style.opacity = "1";
  }
}

let renderer: SpatialRenderer | null | undefined;

/** The page's single spatial renderer, or null where WebGL isn't available. */
export function getSpatial() {
  if (renderer === undefined) {
    try {
      renderer = new SpatialRenderer();
    } catch {
      renderer = null;
    }
  }
  return renderer;
}

/** Ease the active spatial hover back to rest now, e.g. when an overlay
 * opens over the hovered tile (ProjectSlideshow), instead of waiting for a
 * mouseleave the browser only sends on the next mouse move. A no-op if the
 * renderer was never created, so it doesn't spin up WebGL just to stop it. */
export function releaseSpatial() {
  renderer?.leave();
}
