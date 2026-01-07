import * as ts from "typescript";
import tsconfig from "../tsconfig.json" assert { type: "json" };
export default function(/*opts?: Opts*/) {
  function visitor(ctx: ts.TransformationContext, sf: ts.SourceFile) {
    const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult => {
      // here we can check each node and potentially return 
      // new nodes if we want to leave the node as is, and 
      // continue searching through child nodes:
      return ts.visitEachChild(node, visitor, ctx)
    }
    return visitor
  }
  return (ctx: ts.TransformationContext): ts.Transformer => {
    return (sf: ts.SourceFile) => ts.visitNode(sf, visitor(ctx, sf))
  }
}

const compilerHost = ts.createCompilerHost(tsconfig.compilerOptions)
const program = ts.createProgram(["src/index.ts"], compilerOptions, compilerHost)
const msgs = {}
const emitResult = program.emit(undefined, undefined, undefined, undefined, {
  before: [
    myTransform
  ]
})