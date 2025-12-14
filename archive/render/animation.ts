import { Component } from "../types/component";
import { Entity } from "../entity";

export interface AnimationFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class AnimationClip {
  name: string;
  frames: AnimationFrame[];
  frameDuration: number; // ms per frame
  loop: boolean;

  constructor(
    name: string,
    frames: AnimationFrame[],
    frameDuration: number,
    loop: boolean = true,
  ) {
    this.name = name;
    this.frames = frames;
    this.frameDuration = frameDuration;
    this.loop = loop;
  }
}

export class Animator extends Component {
  clips: Map<string, AnimationClip> = new Map();
  currentClip: AnimationClip | null = null;

  elapsedTime: number = 0;
  currentFrameIndex: number = 0;

  constructor(parent: Entity) {
    super(parent);
  }

  start() {}

  addClip(clip: AnimationClip) {
    this.clips.set(clip.name, clip);
  }

  play(name: string) {
    const clip = this.clips.get(name);
    if (clip) {
      if (this.currentClip !== clip) {
        this.currentClip = clip;
        this.elapsedTime = 0;
        this.currentFrameIndex = 0;
      }
    }
  }

  update(delta: number) {
    if (!this.currentClip) return;

    this.elapsedTime += delta;

    if (this.elapsedTime >= this.currentClip.frameDuration) {
      // Consume time steps
      while (this.elapsedTime >= this.currentClip.frameDuration) {
        this.elapsedTime -= this.currentClip.frameDuration;
        this.currentFrameIndex++;
      }

      if (this.currentFrameIndex >= this.currentClip.frames.length) {
        if (this.currentClip.loop) {
          this.currentFrameIndex = 0;
        } else {
          this.currentFrameIndex = this.currentClip.frames.length - 1;
        }
      }
    }
  }

  getCurrentFrame(): AnimationFrame | null {
    if (!this.currentClip) return null;
    return this.currentClip.frames[this.currentFrameIndex];
  }

  // Helper to get UV transform for the shader
  // Returns [offsetX, offsetY, scaleX, scaleY]
  getUVTransform(textureWidth: number, textureHeight: number): Float32Array {
    const frame = this.getCurrentFrame();
    if (!frame) {
      return new Float32Array([0, 0, 1, 1]); // Default full texture
    }

    return new Float32Array([
      frame.x / textureWidth, // Offset X
      frame.y / textureHeight, // Offset Y
      frame.width / textureWidth, // Scale X
      frame.height / textureHeight, // Scale Y
    ]);
  }
}
