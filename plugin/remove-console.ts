import * as ts from 'typescript';

export const removeConsoleLogTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
        const visitor: ts.Visitor = (node) => {
            if (ts.isPropertyDeclaration(node)) {
                // 1. FILTER: Only apply to properties with modifiers (decorators are modifiers now)
                if (!node.modifiers) {
                    return ts.visitEachChild(node, visitor, context);
                }

                // 2. CHECK: Look for the specific decorator (e.g., starts with 'hot.')
                // Note: In a real app, you might want a more robust check than just text matching
                const hasHotDecorator = node.modifiers.some((m) => 
                    ts.isDecorator(m) && 
                    ts.isCallExpression(m.expression) &&
                    ts.isPropertyAccessExpression(m.expression.expression) &&
                    ts.isIdentifier(m.expression.expression.expression) &&
                    m.expression.expression.expression.text === 'hot'
                );

                if (!hasHotDecorator) {
                    return ts.visitEachChild(node, visitor, context);
                }

                // 3. SEPARATE: Split decorators from other modifiers (public, private, static, etc.)
                const decorators = node.modifiers.filter(ts.isDecorator);
                const otherModifiers = node.modifiers.filter((m) => !ts.isDecorator(m));

                // 4. PREVENT DUPLICATES: Don't add 'accessor' if it's already there
                const hasAccessor = otherModifiers.some(m => m.kind === ts.SyntaxKind.AccessorKeyword);
                if (hasAccessor) {
                     return ts.visitEachChild(node, visitor, context);
                }

                // 5. CONSTRUCT: Create the new modifier array in the correct order
                // Order: [Decorators] -> [Accessor] -> [Other Modifiers (public/private)]
                const accessorModifier = ts.factory.createModifier(ts.SyntaxKind.AccessorKeyword);
                const newModifiers = ts.factory.createNodeArray([
                    ...decorators,
                    accessorModifier,
                    ...otherModifiers
                ]);

                // 6. UPDATE
                return ts.factory.updatePropertyDeclaration(
                    node,
                    newModifiers,
                    node.name,
                    node.questionToken,
                    node.type,
                    node.initializer
                );
            }
            return ts.visitEachChild(node, visitor, context);
        };
        return ts.visitNode(sourceFile, visitor);
    };
};