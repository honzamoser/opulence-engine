# Opulence game engine

A (so far) basic game engine built in TypeScript focusing on ECS and WebGPU rendering.

see [TODO](TODO.md) for the roadmap. A full re-write will come eventually if I manage to finish the MVP.

## How to use

For the Helios2 renderer you need to have the [Unsafe WwebGPU support](chrome://flags/#enable-unsafe-webgpu) flag enabled

There is no package or anything yet. To build something with this, clone the repo and start making your game in game_src. It doesn't really matter where you make it as long as you build it behind Vite and import the engine. Also run npm install, even though there is only 1 real dependency.

## A bit of technical stuff

The architecture is based on my own interpretation of ECS:
- Entities are just containers for components, and don't really do anything apart from that as of now. They don't even have IDs for now.
- Components are just classes with fields. No logic, but they can be initialized with a constructor.
- Systems are scripts that are run every frame and on start. They can technically do anything they want, as they are not tied to the components they're built for.

The engine has an API for querying the entities that the system wants. It is to be improved in the future as it isn't the most performant right now, but it'll do.

For the rendering, there is a rendering ECS System that needs to be created. It instantiates the rendering engine inside. The rendering engine is a very basic renderer that supports meshes, lights and a basic camera. Much is planned for the futurue, including materials (maybe even PBR), shadows, post-processing, etc.

The vision for the far future, once this Typescript version can be said to be done, is to rewrite this in a langauge that then compiles to WebAssembly and run it off that.

## Contributing
Feel free to open issues or PRs if you want to contribute! Any help is much appreciated as I am solo on this venture.
