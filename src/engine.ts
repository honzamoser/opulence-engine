
import { startLifecycle } from "./lifecycle";
import { System } from "./ecs/system";
import { Component } from "./ecs/component";
import { PointerManager } from "./data/arrayBufferPointer";
import { ClassConstructor, ECS } from "./ecs/ecs";
import { Helios2Renderer } from "./renderer/renderer";
import { GeneratedComponent, generatedComponents, TransformComponent } from "../generated";

export class Engine extends EventTarget {
  entities: Array<number[]> = [];
  archetypeBasket: ArchetypeBasket = new ArchetypeBasket();
  systems: System[] = [];

  renderer: Helios2Renderer;
  pointerManager: PointerManager;

  canvas: HTMLCanvasElement;



  ecs: ECS;

  constructor(canvas: HTMLCanvasElement) {
    super();
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;

    this.canvas = canvas;

    this.ecs = new ECS();
    this.pointerManager = new PointerManager();
  }

  async load() {
    // await this.ecs.loadNativeComponents();
    // await this.ecs.loadComponents();
  }

  async start() {
    await Promise.all(
      this.systems.map((system) =>
        system.start ? system?.start(this) : Promise.resolve(),
      ),
    );

    startLifecycle(this.update.bind(this));
  }

  async update(delta: number) {
    // this.dispatchEvent(new CustomEvent("update", { detail: delta }));

    this.systems.forEach((x) => {
      if (x.update) {
        x.update(this.entities, delta, this);
      }
    });
    this.systems.forEach((x) => {
      if (x.afterUpdate) {
        x?.afterUpdate(this);
      }
    });
  }

  createEntity(): number {
    return this.entities.push([]) - 1;
  }

  ofEntity(id: number) {
    return this.entities[id];
  }

  public on = this.addEventListener;

  query(...componentTypes: any): number[] {

    return this.archetypeBasket.QueryEntities(componentTypes.map((ct) => (ct as any).IDENTIFIER));

    // const ids = componentTypes.map((ct) => (ct as any).IDENTIFIER);
    // const result: number[] = [];

    // for (let i = 0; i < this.entities.length; i++) {
    //   const entity = this.entities[i];
    //   let hasAll = true;

    //   for (let j = 0; j < ids.length; j++) {
    //     if (entity[ids[j]] === undefined) {
    //       hasAll = false;
    //       break;
    //     }
    //   }

    //   if (hasAll) {
    //     result.push(i);
    //   }
    // }

    // return result;
  }

  addComponent<T extends GeneratedComponent>(
    entityId: number,
    component: ClassConstructor<T>,
    args: Partial<T["_constructionFootprint"]>
  ) {
    console.log(component.IDENTIFIER)
    const componentId = component.new(args);

    this.entities[entityId][component.IDENTIFIER] = componentId;
    const componentKeys = Object.keys(this.entities[entityId]).map(k => parseInt(k));
    console.log(this.entities[entityId], componentKeys)
    this.archetypeBasket.addComponent(entityId, component.IDENTIFIER);


    console.log(component.SET)

    return componentId as number;
  }


}

class Archetype {
  public mask: Uint32Array;
  public entities: number[] = [];

  constructor(mask: Uint32Array) {
    // IMPORTANT: Clone the mask so it doesn't reference the shared "workBitmap"
    this.mask = new Uint32Array(mask);
  }
}

class Query {
  public mask: Uint32Array;
  public matchingArchetypes: Archetype[] = [];

  constructor(componentIds: number[], bitmapSize: number) {
    this.mask = new Uint32Array(bitmapSize);
    for (const id of componentIds) {
      this.mask[Math.floor(id / 32)] |= (1 << (id % 32));
    }
  }

  // Check if an archetype matches this query
  test(archetype: Archetype) {
    // Bitwise check: (Arch & Query) === Query
    for (let i = 0; i < this.mask.length; i++) {
      if ((archetype.mask[i] & this.mask[i]) !== this.mask[i]) return;
    }
    this.matchingArchetypes.push(archetype);
  }
}

const MAX_ENTITIES = 1000;

class ArchetypeBasket {
  // Map hash -> Archetype
  archetypes: Map<string, Archetype> = new Map();
  queries: Query[] = [];

  // --- LOOKUP TABLES (The secret to O(1) performance) ---
  
  // EntityID -> The Archetype it currently belongs to
  private entityArchetype: Array<Archetype | undefined> = new Array(MAX_ENTITIES);
  
  // EntityID -> The index (row) of the entity inside that Archetype's entities array
  private entityRow: Int32Array = new Int32Array(MAX_ENTITIES).fill(-1);
  
  // EntityID -> Current Component Mask
  private entityMasks: Map<number, Uint32Array> = new Map();

  // Reusable work buffer
  private BITMAP_SIZE = Math.ceil(generatedComponents.length / 32);
  private workBitmap = new Uint32Array(this.BITMAP_SIZE);

  /**
   * Adds a component to an entity, handling the migration 
   * from Old Archetype -> New Archetype efficiently.
   */
  addComponent(entityId: number, componentId: number) {
    // 1. Get current state
    let mask = this.entityMasks.get(entityId);
    if (!mask) {
      mask = new Uint32Array(this.BITMAP_SIZE);
      this.entityMasks.set(entityId, mask);
    }

    // Check if component already exists (Bitwise check)
    const blockIndex = Math.floor(componentId / 32);
    const bitIndex = componentId % 32;
    if ((mask[blockIndex] & (1 << bitIndex)) !== 0) return; // Already has it

    // 2. Identify Old Archetype
    const oldArch = this.entityArchetype[entityId];

    // 3. Update Mask & Calculate New Hash
    mask[blockIndex] |= (1 << bitIndex);
    
    // (Optimization: In a real engine, use a Trie or Graph traversal instead of string join)
    const newHash = mask.join(','); 

    // 4. Find or Create New Archetype
    let newArch = this.archetypes.get(newHash);
    if (!newArch) {
      newArch = this.createArchetype(newHash, mask);
    }

    // 5. PERFORM MIGRATION
    // A. Remove from Old Archetype (Swap & Pop)
    if (oldArch) {
      this.removeEntityFromArchetype(oldArch, entityId);
    }

    // B. Add to New Archetype
    const newIndex = newArch.entities.push(entityId) - 1;
    
    // C. Update Lookups
    this.entityArchetype[entityId] = newArch;
    this.entityRow[entityId] = newIndex;
  }

  /**
   * Removes an entity from an archetype in O(1) time
   * without leaving holes in the array.
   */
  private removeEntityFromArchetype(arch: Archetype, entityId: number) {
    const indexToRemove = this.entityRow[entityId];
    const lastIndex = arch.entities.length - 1;
    
    // If the entity is NOT the last one, we must Swap
    if (indexToRemove !== lastIndex) {
      const lastEntity = arch.entities[lastIndex];

      // 1. Move last entity into the hole
      arch.entities[indexToRemove] = lastEntity;

      // 2. CRITICAL: Update the lookup for the entity we just moved!
      this.entityRow[lastEntity] = indexToRemove;
    }

    // Pop the last element (which is now either the one we wanted to remove, or a duplicate of the one we moved)
    arch.entities.pop();
    
    // Clean up the removed entity's lookup
    this.entityArchetype[entityId] = undefined;
    this.entityRow[entityId] = -1;
  }

  private createArchetype(hash: string, mask: Uint32Array): Archetype {
    const newArch = new Archetype(mask);
    this.archetypes.set(hash, newArch);
    
    // Register with queries
    for (const query of this.queries) {
      query.test(newArch);
    }
    return newArch;
  }

  // Helper for ad-hoc queries
  private matches(archMask: Uint32Array, reqMask: Uint32Array): boolean {
    for (let i = 0; i < reqMask.length; i++) {
      if ((archMask[i] & reqMask[i]) !== reqMask[i]) return false;
    }
    return true;
  }

  registerQuery(componentIds: number[]): Query {
    const query = new Query(componentIds, this.BITMAP_SIZE);
    this.queries.push(query);

    // Give the query all existing archetypes that match
    for (const arch of this.archetypes.values()) {
      query.test(arch);
    }
    
    return query;
  }

  // FIXED: Optimized Ad-hoc query
  QueryEntities(requiredComponentIds: number[]): number[] {
    const results: number[] = [];

    // 1. Create a mask just once
    const reqMask = new Uint32Array(this.BITMAP_SIZE);
    for (const id of requiredComponentIds) {
      reqMask[Math.floor(id / 32)] |= (1 << (id % 32));
    }

    // 2. Iterate Archetype OBJECTS, not the map entries
    // We use the cached mask on the archetype, no string parsing!
    for (const arch of this.archetypes.values()) {
      if (this.matches(arch.mask, reqMask)) {
        // Fast array spread
        for(let i = 0; i < arch.entities.length; i++) {
            results.push(arch.entities[i]);
        }
      }
    }
    return results;
  }

  
}