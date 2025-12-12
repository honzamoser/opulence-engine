export type SimpleMesh = {
    positions: Float32Array;
    normals?: Float32Array;
    uvs?: Float32Array;
    indices?: Uint16Array | Uint32Array;
    textureUrl?: string;
};

// Minimal glTF loader: supports single mesh, single primitive, embedded or external image as base64 or URL.
export async function loadGLTF(url: string): Promise<SimpleMesh> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    const obj = await res.json();

    // Support external buffers and images minimal
    if (!obj.meshes || obj.meshes.length === 0) throw new Error('No mesh in glTF');

    const mesh = obj.meshes[0];
    const primitive = mesh.primitives[0];

    // Load buffer data
    const bufferViews = obj.bufferViews || [];
    const accessors = obj.accessors || [];
    const buffers = obj.buffers || [];

    // Helper to load buffer by index
    async function loadBufferViewAccessor(accIndex: number): Promise<ArrayBuffer> {
        const acc = accessors[accIndex];
        const view = bufferViews[acc.bufferView];
        const bufferDef = buffers[view.buffer];
        let bin: ArrayBuffer;
        if (bufferDef.uri && bufferDef.uri.startsWith('data:')) {
            // base64 embedded
            const base64 = bufferDef.uri.split(',')[1];
            const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            bin = bytes.buffer;
        } else if (bufferDef.uri) {
            const br = await fetch(bufferDef.uri);
            bin = await br.arrayBuffer();
        } else {
            throw new Error('Unsupported buffer format');
        }

        const start = view.byteOffset || 0;
        const length = view.byteLength || 0;
        return bin.slice(start, start + length);
    }

    // Read accessor into typed array
    async function readAccessor(accIndex: number): Promise<Float32Array | Uint16Array | Uint32Array> {
        const acc = accessors[accIndex];
        const arrBuf = await loadBufferViewAccessor(accIndex);
        const componentType = acc.componentType;
        const count = acc.count;
        // Assume FLOAT for positions/normals/uvs
        if (componentType === 5126) { // FLOAT
            return new Float32Array(arrBuf, acc.byteOffset || 0, count * (acc.type === 'VEC3' ? 3 : (acc.type === 'VEC2' ? 2 : 1)));
        }
        if (componentType === 5123) { // UNSIGNED_SHORT
            return new Uint16Array(arrBuf, acc.byteOffset || 0, count);
        }
        if (componentType === 5125) { // UNSIGNED_INT
            return new Uint32Array(arrBuf, acc.byteOffset || 0, count);
        }
        throw new Error('Unsupported component type ' + componentType);
    }

    const attributes = primitive.attributes;
    let positions: Float32Array | undefined;
    let normals: Float32Array | undefined;
    let uvs: Float32Array | undefined;

    if (attributes.POSITION !== undefined) positions = await readAccessor(attributes.POSITION) as Float32Array;
    if (attributes.NORMAL !== undefined) normals = await readAccessor(attributes.NORMAL) as Float32Array;
    if (attributes.TEXCOORD_0 !== undefined) uvs = await readAccessor(attributes.TEXCOORD_0) as Float32Array;

    let indices: Uint16Array | Uint32Array | undefined;
    if (primitive.indices !== undefined) {
        const raw = await readAccessor(primitive.indices);
        indices = raw as Uint16Array | Uint32Array;
    }

    // texture: read first image uri
    let textureUrl: string | undefined;
    if (obj.images && obj.images.length > 0) {
        const img = obj.images[0];
        textureUrl = img.uri;
    }

    return {
        positions: positions || new Float32Array([]),
        normals,
        uvs,
        indices,
        textureUrl
    };
}
