import "reflect-metadata";

function TestDecorator() {
  return (target: any, key: string) => {
    const propertyType = Reflect.getMetadata("design:type", target, key);
    console.log(`Property ${key} has type:`, propertyType);
    console.log(`Type name:`, propertyType?.name);
  };
}

class TestClass {
  @TestDecorator()
  myString: string;

  @TestDecorator()
  myNumber: number;

  @TestDecorator()
  myFloat32Array: Float32Array;

  @TestDecorator()
  myObject: object;
}

console.log("Creating TestClass instance...");
const instance = new TestClass();
console.log("Test complete");
