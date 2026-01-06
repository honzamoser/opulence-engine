struct Uniforms {
    viewProj: mat4x4<f32>,
    frustrumPlanes: array<vec4<f32>, 6>,
    time : f32,
};

struct Instances {
    modelMatrix : mat4x4<f32>,
    color : vec4<f32>,
}

struct IndirectCommand {
    indexCount : u32,
    instanceCount : atomic<u32>, // <--- We will toggle this!
    firstIndex : u32,
    baseVertex : u32,
    firstInstance : u32,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

// VERTEX ONLY
@group(1) @binding(0) var<storage, read> instanceBuffer : array<Instances>;
@group(1) @binding(1) var<storage, read> visibleInstances : array<u32>;

// COMPUTE ONLY
@group(1) @binding(0) var<storage, read_write> commands: array<IndirectCommand>;
@group(1) @binding(1) var<storage, read_write> visibleInstancesWrite: array<u32>;
@group(1) @binding(2) var<storage, read> ComputeInstanceBuffer: array<Instances>;

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) color : vec4<f32>,
};

fn checkFrustrum(center: vec3<f32>, radius: f32, planes: array<vec4<f32>, 6>) -> bool {
    for(var i = 0; i < 6; i++) {
        let plane = planes[i];
        let distance = dot(plane.xyz, center) + plane.w;
        if(distance < -radius) {
            return false;
        }
    }
    return true;
}
@compute @workgroup_size(64)
fn cull_main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
    let index = GlobalInvocationID.x;

    let matrix = ComputeInstanceBuffer[index].modelMatrix;
    let center = matrix[3].xyz;

    if(index >= arrayLength(&ComputeInstanceBuffer)) {
        return;
    }

    let radius = 3.0;

    let isVisible = checkFrustrum(center, radius, uniforms.frustrumPlanes);

    if(isVisible) {
        let outIndex = atomicAdd(&commands[0].instanceCount, 1u);
        visibleInstancesWrite[outIndex] = index;
    }
}
@vertex
fn vs_main(
    @builtin(instance_index) ii : u32,
    @location(0) pos : vec3<f32>
) -> VertexOutput {
    let realId = visibleInstances[ii];

        // 2. DATA FETCH
        let instData = instanceBuffer[realId];
        let worldPos = instData.modelMatrix * vec4<f32>(pos, 1.0);

        var out: VertexOutput;
        out.Position = uniforms.viewProj * worldPos;
        out.color = instData.color;
        return out;
    // var output : VertexOutput;
    // let instanceMatrix = instanceBuffer[ii].modelMatrix;
    // let instanceColor = instanceBuffer[ii].color;
    // let localPos = vec4<f32>(pos, 1.0);
    // let worldPos = instanceMatrix * localPos;
    // output.Position = uniforms.viewProj * worldPos;
    // output.color = instanceColor;
    // return output;
}
@fragment
fn fs_main(@location(0) color : vec4<f32>) -> @location(0) vec4<f32> {
    return color;
}
