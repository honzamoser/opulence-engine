# ECS

The Opulence-ECS engine is designed to be light-weight, performant and effecient. It uses a decorator-based component defining system, serializers for each type and ArrayBuffers for fast data access and cache-locality.

## How to use?

### Create an entity

Entity data is held by the opulence [Engine class](../src/engine.ts). It is simply a 2d array, where the index of the array is the entity ID. The contents of the array are the references to the components it carries. The index of the ID is the type of component.

This is how an example entity array might look like:
```
[
  [
    x, x, 0, 1
  ]
]
```

For this case, let's say that we have 2 components defined:
```
MeshComponent; ID = 2
TransformComponent; ID = 3
```

As you can see, the entity has the value 0 at index 2 and value 1 at entity 3. This translates to *"The entity has a Mesh Component and it's ID is 0, and a Transform Component and it's id is 1"*

To actually create an entity, you should use `engine.createEntity();`

### Create a component instance

The foot print for creating a component looks like this:
```
addComponent<T extends Component>(
    entityId: number,
    component: ClassConstructor<T>,
    args: any[] = [],
)
```

Let's walk through the parameters:
- entityId: The ID of the entity in the engine.entities array.
- component: The **constructor** of the component. This would be, for example, MeshComponent
- args: an array of construction arguments. These are defined in the component definition using the @constructor decorators, and go in the order defined in the decorators. See below.

```
@hot.int32
@constructor(0) // <- The parameter given in the first place in the array will be bound to meshId
meshId: number;
```

Usage example:

```
let cubeMesh = uploadMesh() //... 
let cubeEntity = engine.createEntity()

engine.addComponent(cubeEntity, MeshComponent, [cubeMesh]);
engine.addComponent(cubeEntity, TransformComponent, [
     new Float32Array([0, 0, -5]),
     new Float32Array([0, 0, 0]),
     new Float32Array([1, 1, 1]),
]);
```
