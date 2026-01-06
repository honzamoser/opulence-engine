// Indirect draw arguments structure
struct IndirectDrawIndexed {
    indexCount: u32,
    instanceCount: atomic<u32>,
    firstIndex: u32,
    baseVertex: u32,
    firstInstance: u32,
}

// Object data structure (80 bytes aligned)
struct ObjectData {
    modelMatrix: mat4x4<f32>,  // 64 bytes
    color: vec4<f32>,          // 16 bytes
}

// Light structure
struct Light {
    position: vec3<f32>,
    range: f32,
    color: vec3<f32>,
    intensity: f32,
}

// Scene uniforms
struct Uniforms {
    viewProjection: mat4x4<f32>,
    cameraPosition: vec3<f32>,
    padding1: f32,
    lightCount: u32,
    padding2: u32,
    padding3: u32,
    padding4: u32,
    lights: array<Light, 8>,
}

// ============================================================================
// COMPUTE SHADER - Culling Pass
// ============================================================================

// Compute shader bindings (with write access)
@group(0) @binding(0) var<uniform> computeUniforms: Uniforms;
@group(1) @binding(0) var<storage, read> computeObjects: array<ObjectData>;
@group(1) @binding(1) var<storage, read_write> computeVisibleIndices: array<u32>;
@group(1) @binding(2) var<storage, read_write> computeIndirectArgs: IndirectDrawIndexed;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;

    // Bounds check
    if (index >= arrayLength(&computeObjects)) {
        return;
    }

    let object = computeObjects[index];

    // Extract object position from model matrix (4th column)
    let objectPos = object.modelMatrix[3].xyz;

    // Distance-based culling
    let dist = distance(objectPos, computeUniforms.cameraPosition);
    let isVisible = dist < 50.0;

    if (isVisible) {
        // Atomically increment instance count and get slot
        let slot = atomicAdd(&computeIndirectArgs.instanceCount, 1u);

        // Store object index in visible list
        computeVisibleIndices[slot] = index;
    }
}

// ============================================================================
// RENDER SHADER - Vertex & Fragment
// ============================================================================

// Render shader bindings (read-only for vertex shader compatibility)
@group(0) @binding(0) var<uniform> renderUniforms: Uniforms;
@group(1) @binding(0) var<storage, read> renderObjects: array<ObjectData>;
@group(1) @binding(1) var<storage, read> renderVisibleIndices: array<u32>;

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) color: vec4<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPos: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) color: vec4<f32>,
}

@vertex
fn vs_main(
    @builtin(instance_index) instanceIdx: u32,
    input: VertexInput
) -> VertexOutput {
    // Look up which object this instance represents
    let objectIndex = renderVisibleIndices[instanceIdx];
    let object = renderObjects[objectIndex];

    var output: VertexOutput;

    // Transform vertex position
    let worldPos = object.modelMatrix * vec4<f32>(input.position, 1.0);
    output.position = renderUniforms.viewProjection * worldPos;
    output.worldPos = worldPos.xyz;

    // Transform normal (assuming uniform scale, otherwise use inverse transpose)
    output.normal = normalize((object.modelMatrix * vec4<f32>(input.normal, 0.0)).xyz);

    // Use object color (could blend with vertex color if needed)
    output.color = object.color;

    return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    var finalColor = vec3<f32>(0.0, 0.0, 0.0);

    // Ambient light
    let ambient = 0.2;
    finalColor += input.color.rgb * ambient;

    // Calculate lighting
    for (var i = 0u; i < renderUniforms.lightCount; i++) {
        let light = renderUniforms.lights[i];
        let lightDir = normalize(light.position - input.worldPos);
        let distance = length(light.position - input.worldPos);

        // Attenuation
        let attenuation = 1.0 / (1.0 + distance * distance / (light.range * light.range));

        // Diffuse
        let diffuse = max(dot(input.normal, lightDir), 0.0);

        // Add light contribution
        finalColor += input.color.rgb * light.color * light.intensity * diffuse * attenuation;
    }

    return vec4<f32>(finalColor, input.color.a);
}
