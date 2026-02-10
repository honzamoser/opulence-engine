import { Engine } from "../../engine";
import { ColliderComponent, RigidbodyComponent, TransformComponent } from "@generated";
import { System } from "../system";
import * as CANNON from "cannon-es"


export default class PhysicsSystem extends System {

    world: CANNON.World;

    public update(entities: Array<number[]>, delta: number, engine: Engine): void {
        const rigidBodies = engine.query(RigidbodyComponent, TransformComponent, ColliderComponent);

        this.world.fixedStep();

        for (const entity of rigidBodies) {
            const rbCompId = engine.entities[entity][RigidbodyComponent.IDENTIFIER];
            const transformCompId = engine.entities[entity][TransformComponent.IDENTIFIER];
            const colliderCompId = engine.entities[entity][ColliderComponent.IDENTIFIER];

            const rbComp = RigidbodyComponent.to(rbCompId);
            const transformComp = TransformComponent.to(transformCompId);
            const colliderComp = ColliderComponent.to(colliderCompId);

            if (rbComp.bodyId === -1) {
                rbComp.bodyId = this.initializeEntity();
            } else {
                const body = this.world.bodies.find(b => b.id === rbComp.bodyId);
                if (body) {
                    // Update position and rotation from physics simulation
                    transformComp.positionX = body.position.x;
                    transformComp.positionY = body.position.y;
                    transformComp.positionZ = body.position.z;

                    const EulerRotation = new CANNON.Vec3();
                    body.quaternion.toEuler(EulerRotation)

                    transformComp.rotationX = EulerRotation.x;
                    transformComp.rotationY = EulerRotation.y;
                    transformComp.rotationZ = EulerRotation.z;
                }
            }
        }
    }

    validateMesh(vertices, indices) {
        // 1. Check Vertex Count
        if (vertices.length % 3 !== 0) {
            console.error(`⚠️ Vertex array length (${vertices.length}) is not a multiple of 3! You have partial data.`);
        }

        // 2. Check for NaNs or Undefined in Vertices
        for (let i = 0; i < vertices.length; i++) {
            if (vertices[i] === undefined || isNaN(vertices[i])) {
                console.error(`⚠️ Found BAD DATA in vertices at index ${i}:`, vertices[i]);
                return false;
            }
        }

        // 3. Check Indices Range
        const maxVertexIndex = (vertices.length / 3) - 1;
        for (let i = 0; i < indices.length; i++) {
            if (indices[i] > maxVertexIndex) {
                console.error(`⚠️ Face Index Out of Bounds! Index ${indices[i]} requested, but max vertex is ${maxVertexIndex}.`);
                return false;
            }
            if (indices[i] < 0) {
                console.error(`⚠️ Negative Index Found: ${indices[i]}`);
                return false;
            }
        }

        console.log("✅ Mesh Data looks safe.");
        return true;
    }

    initializeEntity() {
        if(ColliderComponent.shapeType == 2) {
            const vertices = ColliderComponent.vertices;
            const indices = ColliderComponent.indices;

            this.validateMesh(vertices, indices);

            console.log("creating mesh for " + TransformComponent.positionY)

            const uniqueVerts = []; // Array of CANNON.Vec3
            const newFaces = [];    // Array of Arrays

            // Map to keep track of existing positions: "x_y_z" -> newIndex
            const vertMap = {};
            const indexRemap = []; // Maps oldIndex -> newIndex

            // 1. Process Vertices: Filter out duplicates
            // We iterate by *index* to ensure we handle the geometry correctly
            // But we look up the *vertex* position to detect duplicates

            // Helper to create a spatial key (hashes the position)
            const getKey = (x, y, z) => `${x.toFixed(4)}_${y.toFixed(4)}_${z.toFixed(4)}`;

            // Rebuild a clean list of unique vertices
            // We loop through the original vertex buffer
            for (let i = 0; i < vertices.length; i += 3) {
                const x = vertices[i];
                const y = vertices[i + 1];
                const z = vertices[i + 2];

                const key = getKey(x, y, z);

                if (vertMap[key] === undefined) {
                    // Found a new unique vertex
                    const newIndex = uniqueVerts.length;
                    vertMap[key] = newIndex;
                    uniqueVerts.push(new CANNON.Vec3(x, y, z));
                    indexRemap.push(newIndex);
                } else {
                    // Found a duplicate, point to the existing one
                    indexRemap.push(vertMap[key]);
                }
            }

            // 2. Process Faces: Remap old indices to new unique indices
            for (let i = 0; i < indices.length; i += 3) {
                const a = indexRemap[indices[i]];
                const b = indexRemap[indices[i + 1]];
                const c = indexRemap[indices[i + 2]];

                // Optional: degenerate triangle check (points shouldn't be same)
                if (a !== b && b !== c && c !== a) {
                    newFaces.push([a, b, c]);
                }
            }


            const shape = new CANNON.ConvexPolyhedron({
                vertices: uniqueVerts,
                faces: newFaces,

            })

            shape.computeNormals();
            shape.updateBoundingSphereRadius()

            const body = new CANNON.Body({
                mass: RigidbodyComponent.mass == 0 ? 0 : RigidbodyComponent.mass,
                shape: shape,
                type: RigidbodyComponent.isStatic ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC,
            });

            body.position.set(TransformComponent.positionX, TransformComponent.positionY, TransformComponent.positionZ);
            body.quaternion.setFromEuler(TransformComponent.rotationX, TransformComponent.rotationY, TransformComponent.rotationZ, "XYZ");

            console.log(TransformComponent.position)

            this.world.addBody(body);
            return body.id;
        } else if (ColliderComponent.shapeType == 1) {
            const shape = new CANNON.Plane();

            const body = new CANNON.Body({
                mass: RigidbodyComponent.mass == 0 ? 0 : RigidbodyComponent.mass,
                shape: shape,
                type: RigidbodyComponent.isStatic ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC,
            });

            body.position.set(TransformComponent.positionX, TransformComponent.positionY, TransformComponent.positionZ);
            
            body.quaternion.setFromEuler(-Math.PI / 2, TransformComponent.rotationY, TransformComponent.rotationZ, "XYZ");

            this.world.addBody(body);
        }
    }


    public start(engine: Engine): void {
        console.log("Staring PhysX");

        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        })
    }

}