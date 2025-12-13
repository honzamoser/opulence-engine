struct Light {
  position: vec4<f32>,
  color: vec4<f32>
}

struct SceneUniforms {
  viewProjection: mat4x4<f32>,
  cameraPosition: vec4<f32>,
  lightCount: vec4<u32>,
  lights: array<Light, 8>
}

@group(0) @binding(0) var<uniform> scene: SceneUniforms;


struct ObjectUniforms {
  color: vec4<f32>,
  modelMatrix: mat4x4<f32>,
}

@group(1) @binding(0) var<uniform> object: ObjectUniforms;

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) normal : vec3<f32>,
    @location(1) fragPos : vec3<f32>,
    @location(2) color : vec4<f32>,
}

@vertex
fn vs_main(@location(0) position : vec3<f32>, @location(1) normal : vec3<f32>, @location(2) color : vec4<f32>) -> VertexOutput {
    var output : VertexOutput;
    let worldPosition = object.modelMatrix * vec4<f32>(position, 1.0);
    output.fragPos = worldPosition.xyz;

    output.Position = scene.viewProjection * worldPosition;

    output.normal = (object.modelMatrix * vec4<f32>(normal, 0.0)).xyz;
    output.color = color;

    return output;
}

@fragment
fn fs_main(@location(0) normal : vec3<f32>, @location(1) fragPos : vec3<f32>, @location(2) color : vec4<f32>) -> @location(0) vec4<f32> {
  let N = normalize(normal);
  var totalLight = vec3<f32>(0.0);
  let ambient = vec3<f32>(0.3, 0.3, 0.3);

  let count = scene.lightCount.x;

  for (var i: u32 = 0; i < count; i++) {
    let light = scene.lights[i];
    let range = light.position.w;
    let intensity = light.color.w;
    let lightColor = light.color.rgb;

    var L: vec3<f32>;
    var attenuation: f32;

    if (range > 0.0) {
      // Point light
      let lightDir = light.position.xyz - fragPos;
      let distance = length(lightDir);
      L = normalize(lightDir);
      attenuation = max(1.0 - (distance / range), 0.0);
    } else {
      // Directional light (range <= 0)
      L = normalize(-light.position.xyz);
      attenuation = 1.0;
    }

    let diffuse = max(dot(N, L), 0.0);
    totalLight += lightColor * diffuse * attenuation * intensity;
  }

  let objectColor = object.color.rgb;
  let finalColor = objectColor * color.xyz * (ambient + totalLight);

  return vec4<f32>(finalColor, color.a);
}
