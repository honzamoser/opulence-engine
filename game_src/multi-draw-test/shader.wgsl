@vertex
fn vs_main(@builtin(position) pos : vec3<f32>, @builtin(instance_index) instanceIdx: u32) -> @builtin(position) vec4<f32> {
    // Look up which object this instance represents
    let objectIndex = renderVisibleIndices[instanceIdx];
    let object = renderObjects[objectIndex];

    // Transform vertex position
    let worldPos = object.modelMatrix * vec4<f32>(pos, 1.0);
    return renderUniforms.viewProjection * worldPos;
}
