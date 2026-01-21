# Opulence ECS engine

The Opulence ECS Engine is a compiled ECS system, taking easy, user readbable typescript-based class notation of components and transforming them into javascript - optimal static class, while retaining type information.

Their static nature means that no references have to be held by an ECS manager. They do, however, need to be initialized with buffers and allocators, so the memory-management of the engine is still managed outside the scope of the component.

## Compilation
//TODO: Component paths
Each component that matches one of the component paths (in a defined directory, ends with .component.ts) will get transformed by the compiler at start and after a change has been made to the file. This is all managed by a vite plugin. 

The transformer reads the file and converts the class into a static class of the same name. This means the user has to pay attention to where he imports the component from. Every component should be import from "@generated", which is an alias to the "generated/ folder.

Better vite compatibility as well as partial recompilation is in progress as of now.

## Usage

### Definition of a component

Components are defined as a class in a file with a default export. There is no specific naming convention, but the class should be named XComponent (eg. RigidBodyComponent, TransformComponent) and the file HAS to end with .component.ts (rigidbody.component.ts, transform.component.ts)

There are a handful of supported types. The compiler can be expanded to support more types by providing a getter, setter and more functions for each type (eg. Vec3 type (actually a Float32Array of size 3) has a getter, setter, cpy_ and X, Y, Z property that is generated). objects are currently not supported. The type has to be declared on the property in order for the component to be parsed. You can assign a default value to the component by setting the value of the property. 

Types supported by default are:
- **string** (default size of 64, scaling explained lower)
- **number** (f32 = Float32)
- All **typed arrays** (Float32Array...)
- gl-matrix **Vec3** (which are actually Float32Arrays, but you get XYZ accessors on the Vec3)
- gl-matrix **Mat4**
- pointers: **PointerTo**<type> -> translates to {ptr: number, ptr_len: number} = 2b
- custom sizes: **SizeOf**<type, size>, creates a property of given type, limited to a given size. Useful for strings and arrays.

Non-typed arrays are generally not allowed to be stored in the component due to their expandable nature and the fact that they would get translated into TypedArrays anyways.

Component definition example: 
```
export default class RigidBodyComponent {
    position: Vec3; // Defines a property that will be initialized with zeroes
    rotation: Vec3 = vec3.zero() // Defines a property with an initializer
    scale: Vec3 = new Float32Array([1, 2, 3]) // Static initializer - initializers are evaled so it can be anything

    // More abstract
    vertices: PointerTo<Float32Array>; // Pointers are not implemented yet, but this will define a pointer that is null
    tag: string; // this will translate to a string (secretely a u8[] / char[]) of size 64, which is the default
    layer: SizeOf<string, 128> // this will create a string of size 128. If you want unlimited size you have to point to a pointer like this:
    name: PointerTo<string>

