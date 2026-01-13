temp:

instancing and batch instancing

    // const pyramidData = createPyramid();
    // const pyramid = renderer.uploadMesh(
    //   pyramidData.vertices,
    //   pyramidData.indices,
    //   pyramidData.normals,
    // );

    // let instancesData = [];
    // const instanceCount = 500;

    // renderer._instantiate(
    //   cubeMesh,
    //   mat4.translation([0, 0, -10]),
    //   new Float32Array([1, 0, 0, 1]),
    // );

    // for (let i = 0; i < instanceCount; i++) {
    //   const translationMatrix = mat4.translation([
    //     (Math.random() - 0.5) * 10,
    //     (Math.random() - 0.5) * 10,
    //     (Math.random() - 0.5) * 10,
    //   ]);
    //   const scale = Math.random() * 0.5 + 0.1;
    //   const scaleMatrix = mat4.scaling([scale, scale, scale]);
    //   const modelMatrix = mat4.multiply(translationMatrix, scaleMatrix);

    //   instancesData.push({
    //     matrix: modelMatrix,
    //     color: new Float32Array([0, 1, 0, 1]),
    //   });
    // }

    // renderer._instantiateBatch(pyramid, instancesData);

    // for (let i = 0; i < 150; i++) {
    //   const translationMatrix = mat4.translation([
    //     (Math.random() - 0.5) * 10,
    //     (Math.random() - 0.5) * 10,
    //     (Math.random() - 0.5) * 10,
    //   ]);
    //   const scale = Math.random() * 0.5 + 0.1;
    //   const scaleMatrix = mat4.scaling([scale, scale, scale]);
    //   const modelMatrix = mat4.multiply(translationMatrix, scaleMatrix);

    //   // break;

    //   renderer._instantiate(
    //     cubeMesh,
    //     modelMatrix,
    //     new Float32Array([0, 0, 1, 1]),
    //   );
    // }

    // instancesData = [];
    // for (let i = 0; i < instanceCount; i++) {
    //   const translationMatrix = mat4.translation([
    //     (Math.random() - 0.5) * 10,
    //     (Math.random() - 0.5) * 10,
    //     (Math.random() - 0.5) * 10,
    //   ]);
    //   const scale = Math.random() * 0.5 + 0.1;
    //   const scaleMatrix = mat4.scaling([scale, scale, scale]);
    //   const modelMatrix = mat4.multiply(translationMatrix, scaleMatrix);

    //   instancesData.push({
    //     matrix: modelMatrix,
    //     color: new Float32Array([1, 0, 0, 1]),
    //   });
    // }

    // renderer._instantiateBatch(pyramid, instancesData);
    //
    
    // const cubeEntitiy = engine.createEntity();
    // engine.addComponent(cubeEntitiy, MeshComponent, [cubeMesh]);
    // engine.addComponent(cubeEntitiy, TransformComponent, [
    //   new Float32Array([0, 0, -5]),
    //   new Float32Array([0, 0, 0]),
    //   new Float32Array([1, 1, 1]),
    // ]);

    // console.log(engine.entities[cubeEntitiy]);