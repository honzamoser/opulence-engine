import { Matrix4 } from "../types/matrix4";

export class Camera3D {
    position: { x: number; y: number; z: number } = { x: 0, y: 20, z: 0 };
    target: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
    up: { x: number; y: number; z: number } = { x: 0, y: 1, z: 0 };
    zoom: number = 1;
    orthographic: boolean = true;

    constructor() {}

    // Simple top-down orthographic projection
    projection(width: number, height: number, near = -100, far = 100): Matrix4 {
        if (this.orthographic) {
            const halfW = (width / 2) / this.zoom;
            const halfH = (height / 2) / this.zoom;
            return Matrix4.orthographic(-halfW + this.position.x, halfW + this.position.x, -halfH + this.position.z, halfH + this.position.z, near, far);
        }

        return Matrix4.identity();
    }

    view(): Matrix4 {
        // For top-down camera we position above and look down
        // Build a simple lookAt by translating so that camera is at origin
        // (Using only translation for now; for more complex rotations expand later)
        const tx = -this.position.x;
        const ty = -this.position.y;
        const tz = -this.position.z;
        return Matrix4.translation(tx, ty, tz);
    }

    pan(dx: number, dz: number) {
        this.position.x += dx;
        this.position.z += dz;
        this.target.x += dx;
        this.target.z += dz;
    }

    zoomBy(factor: number) {
        this.zoom = Math.max(0.1, this.zoom * factor);
    }
}

export default Camera3D;
