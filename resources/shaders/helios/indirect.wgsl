struct IndirectArgs {
    vertexCount: u32, instanceCount: atomic<u32>, firstIndex: u32, baseVertex: u32, firstInstance: u32,
}
struct ObjectData { model: mat4x4<f32>, meshId: u32, localRadius: f32 }
struct Uniforms { viewProj: mat4x4<f32>, frustrumPlanes: array<vec4<f32>, 6> }

fn is_visible(matrix: mat4x4<f32>, radius: f32) -> bool {
    let pos = vec3<f32>(matrix[3].x, matrix[3].y, matrix[3].z);

    for (var i = 0; i < 6; i++) {
        let plane = global.frustrumPlanes[i];

        let dist = dot(plane.xyz, pos) + plane.w;

        if(dist < -radius ) {
            return false;
        }
    }

    return true;
}

// Group 0: Global
@group(0) @binding(0) var<uniform> global: Uniforms;

// Group 1: Static Scene (Read-Only)
@group(1) @binding(0) var<storage, read> objects: array<ObjectData>;


// used by COMPUTE
@group(2) @binding(0) var<storage, read_write> visible_indices_write: array<u32>;
@group(2) @binding(1) var<storage, read_write> draw_commands: array<IndirectArgs>;

// Used by VERTEX
// Note: This is bound at set index 2 in the Render Pipeline!
@group(2) @binding(0) var<storage, read> visible_indices_read: array<u32>;


// --- COMPUTE ---
// @compute @workgroup_size(64)
// fn cull_main(@builtin(global_invocation_id) id: vec3<u32>) {
//     let idx = id.x;
//     if (idx >= arrayLength(&objects)) { return; }

//     let obj = objects[idx];

//     if(is_visible(obj.matrix)) {

//         let cmd_index = obj.meshId;

//         atomicAdd(&draw_commands[cmd_index].instanceCount, 1u);
//     } else {
//         return;
//     }
// }

// --- VERTEX ---
struct VOut { @builtin(position) pos: vec4<f32>, @location(0) color: vec4<f32> }

@vertex
fn vs_main(@builtin(instance_index) ii: u32, @location(0) pos: vec3<f32>) -> VOut {

    let objIdx = visible_indices_read[ii]; // Indirection lookup
    let obj = objects[objIdx];

    var out: VOut;
    out.pos = global.viewProj * obj.model * vec4<f32>(pos, 1.0);
    // out.color = obj.color;
    return out;
}

// --- FRAGMENT ---
@fragment fn fs_main(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
    return color;
}
