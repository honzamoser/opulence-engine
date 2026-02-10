## Step 1: Analyze file
- Find the component class
- Collect all the properties of the class

## Step 2: Evaluate types
- Go through each property
- Recurse through all their children, omitting empty nodes and symbol nodes (like <, >,,)
- If the property has children (more than 1 node), the type is the first node and the children are typeArguments.
- If the property has 1 child, then it is the type.
- If the property cannot be matched to a node, try to dealias it. If the alias matches a type, it is the node.
- Otherwise it cannot be matched.

## Step 3: Organize property
- Call the decoder of the property.
- The decoder outputs information like the byteLength, type and more to the property list.

## Step 4: Transform the class
- Initialize the transformed class with boilerplate code and initialization code.

## Step 5: Transform properties
- Call the transform function of the property.
- The transform function returns the code the property translates to.
- Write the code to the output file.