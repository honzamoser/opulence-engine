import { Engine } from "../../engine";
import { ColliderComponent, RigidbodyComponent, TransformComponent } from "@generated";
import { System } from "../system";
import * as CANNON from "cannon-es"


export default class PhysicsSystem extends System {

    world: CANNON.World;

    public update(entities: Array<number[]>, delta: number, engine: Engine): void {
        const rigidBodies = engine.query(RigidbodyComponent, TransformComponent, ColliderComponent);

        for (const entityId of rigidBodies) {
            this.simulateRigidBody(entityId, delta, engine);
            ColliderComponent.to(entityId)
            

            // console.log(ColliderComponent.CURSOR, ColliderComponent.vertices)
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