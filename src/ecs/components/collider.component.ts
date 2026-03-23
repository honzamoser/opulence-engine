import { PointerTo } from "compiler/component_parsers";
import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";



export class ColliderComponent {
    size: Vec3 = vec3.create(1, 1, 1);
    offset: Vec3 = vec3.create(0, 0, 0);

    boundingBoxMin: Vec3 = vec3.create(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
    );
    boundingBoxMax: Vec3 = vec3.create(
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
    );

    matrix: Mat4 = mat4.create();

    vertices: PointerTo<Float32Array>;
    indices: PointerTo<Uint32Array>;
    shapeType: number = 0; // 0 = box, 1 = plane, 2 = mesh
}
