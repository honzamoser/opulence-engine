import { Component } from "../ecs/component";
import MeshComponent from "../ecs/components/mesh";
import { Engine } from "../engine";
import { ClassConstructor } from "../ecs/ecs";

export function log_entity(engine: Engine, entityId: number) {
  const components = engine.entities[entityId];

  if (!components) {
    console.log(`Entity ${entityId} does not exist.`);
    return;
  }

  console.log("-".repeat(8));

  console.log(`Entity ${entityId}: `);
  for (const [componentId, componentInstanceId] of Object.entries(components)) {
    console.log(
      `  Component: ${engine.ecs.getComponentById(Number.parseInt(componentId))[0]} (${componentId}) -> Instance ID: `,
      componentInstanceId,
    );
  }
  console.log(components);

  console.log("-".repeat(8));
}

export function log_component<T extends Component>(
  engine: Engine,
  entityId: number,
  c: ClassConstructor<T>,
) {
  const componentTypeid = c.id;
  const componentInstanceId = engine.entities[entityId][componentTypeid];
  const component = engine.ecs.getComponentValues(componentInstanceId, c);
  console.log("-".repeat(8) + ` Component readout ${entityId}`);

  console.log(
    `Component: ${c.constructor.name} (${componentTypeid}) -> Instance ID: `,
    componentInstanceId,
  );

  console.log(component);
}
