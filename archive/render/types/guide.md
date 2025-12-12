Here is a detailed guide on how the sprite rendering system was built, breaking down each part of the implementation.

### 1. The Math: `Matrix4`
**File:** matrix4.ts

To move, rotate, and scale objects in a 3D/2D space (WebGPU is inherently 3D), we use **Matrices**. A 4x4 matrix can represent all these transformations combined.

*   **Identity**: The "default" state (no change).
*   **Translation**: Moves points by `x, y, z`.
*   **Scaling**: Multiplies dimensions by `x, y, z`.
*   **RotationZ**: Rotates around the Z-axis (which points out of the screen), perfect for 2D rotation.
*   **Orthographic Projection**: This is crucial for 2D games. It maps our "World Coordinates" (e.g., pixels 0 to 640) to WebGPU's "Clip Space" (coordinates -1.0 to 1.0). Without this, you'd have to position everything using numbers between -1 and 1 manually.

### 2. The Component: `Texture`
**File:** texture.ts

Previously, this just held vertices. Now, it acts as a container for the GPU resources needed to draw an image.

*   **`url`**: The path to the image file.
*   **`load(device)`**: This is an async method that:
    1.  Fetches the image.
    2.  Creates a `GPUTexture` (the raw memory on the GPU).
    3.  Copies the image data into that texture.
    4.  Creates a `GPUTextureView` (describes how to look at the texture).
    5.  Creates a `GPUSampler` (describes how to read pixels, e.g., linear filtering).

### 3. The Renderer: `Renderer`
**File:** renderer.ts

This is where the magic happens. I added a new method `initializeSpriteSystem` and `renderEntities`.

#### A. Initialization (`initializeSpriteSystem`)
We set up the resources that stay the same for every frame:
1.  **Quad Buffer**: A simple square made of 2 triangles (6 vertices). It goes from -0.5 to 0.5. This is our "stamp" that we will scale and move around.
2.  **Bind Group Layouts**: These tell the GPU what kind of data to expect (Uniforms, Textures, Samplers).
3.  **Pipeline**: Combines the shader, the vertex layout, and the blend modes (so transparent textures work).

#### B. The Shader (WGSL)
Embedded inside renderer.ts, the shader has two parts:
*   **Vertex Shader (`vs_main`)**:
    *   Takes the raw square vertex position.
    *   Multiplies it by the **Model Matrix** (Entity's position/rotation/scale).
    *   Multiplies that by the **Projection Matrix** (Camera/Screen setup).
    *   Result: The vertex lands in the correct spot on the screen.
*   **Fragment Shader (`fs_main`)**:
    *   Takes the UV coordinates (texture mapping coordinates) passed from the vertex shader.
    *   Samples the texture color at that spot.

#### C. Rendering (`renderEntities`)
Every frame, this function runs:
1.  **Update Projection**: Calculates the camera view (0 to 640 width, etc.) and uploads it to the GPU.
2.  **Begin Pass**: Clears the screen.
3.  **Loop through Entities**:
    *   Checks if the entity has a loaded `Texture` component.
    *   **Calculate Model Matrix**:
        *   Start with Identity.
        *   Translate (Move) to `entity.position`.
        *   Rotate by `entity.rotation`.
        *   Scale by `entity.scale`.
    *   **Upload Matrix**: Writes this specific matrix to a uniform buffer.
    *   **Draw**: Tells the GPU to draw the 6 vertices of our Quad using this specific matrix and texture.

### 4. Usage: index.ts
**File:** index.ts

Finally, we tie it together:
1.  Initialize the `Renderer`.
2.  Create an `Entity`.
3.  Add a `Texture` component to it and call `.load()`.
4.  In the `startLifecycle` loop:
    *   Update the entity (e.g., increase rotation).
    *   Call `renderer.renderEntities(world.entities)` to draw everything.

### Summary of Data Flow
1.  **CPU**: `Entity Position` -> `Matrix4` -> `GPUBuffer`
2.  **GPU Vertex Shader**: `Quad Vertex` * `Matrix` -> `Screen Position`
3.  **GPU Fragment Shader**: `Texture` + `UV Coords` -> `Pixel Color`