export class Matrix4 {
    values: Float32Array;

    constructor() {
        this.values = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    static identity(): Matrix4 {
        return new Matrix4();
    }

    static translation(x: number, y: number, z: number): Matrix4 {
        const m = new Matrix4();
        m.values[12] = x;
        m.values[13] = y;
        m.values[14] = z;
        return m;
    }

    static scaling(x: number, y: number, z: number): Matrix4 {
        const m = new Matrix4();
        m.values[0] = x;
        m.values[5] = y;
        m.values[10] = z;
        return m;
    }

    static rotationZ(angle: number): Matrix4 {
        const m = new Matrix4();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        m.values[0] = c;
        m.values[1] = s;
        m.values[4] = -s;
        m.values[5] = c;
        return m;
    }

    multiply(other: Matrix4): Matrix4 {
        const m = new Matrix4();
        const a = this.values;
        const b = other.values;
        const out = m.values;

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += a[i * 4 + k] * b[k * 4 + j]; // Row-major? WebGPU is usually column-major for storage, but let's check.
                    // Actually, standard matrix multiplication:
                    // C[row][col] = sum(A[row][k] * B[k][col])
                    // If stored as flat array, it depends on if we treat it as row-major or column-major.
                    // gl-matrix and WebGPU usually prefer column-major.
                    // Let's assume column-major storage for the array:
                    // 0  4  8  12
                    // 1  5  9  13
                    // 2  6  10 14
                    // 3  7  11 15
                }
            }
        }
        
        // Let's use a proven implementation for column-major multiplication
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        return m;
    }
    
    static orthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): Matrix4 {
        const m = new Matrix4();
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);
        
        m.values[0] = -2 * lr;
        m.values[5] = -2 * bt;
        m.values[10] = 2 * nf; // WebGPU clip space is 0 to 1 for Z? Or -1 to 1?
        // WebGPU default is [0, 1] for Z.
        // Standard ortho for [0, 1] Z:
        // 2/(r-l)   0         0         0
        // 0         2/(t-b)   0         0
        // 0         0         1/(n-f)   0  <-- Note the 1 instead of 2 if mapping to [0,1]
        // -(r+l)/(r-l) -(t+b)/(t-b) -n/(f-n) 1
        
        // Let's stick to standard -1 to 1 for now and configure the context/pipeline if needed, 
        // but WebGPU usually expects 0 to 1.
        // Let's use the 0 to 1 Z range formula.
        
        m.values[0] = 2 / (right - left);
        m.values[5] = 2 / (top - bottom);
        m.values[10] = 1 / (near - far);
        
        m.values[12] = (left + right) / (left - right);
        m.values[13] = (top + bottom) / (bottom - top);
        m.values[14] = near / (near - far);
        m.values[15] = 1;

        return m;
    }
}
