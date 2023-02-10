import * as t from "@babel/types";
import traverse from "@babel/traverse";

import { TransformerInput } from "./transformer";
import { replaceWith, replaceWithMultiple } from "./utils/common";

export function transformFunctionalComponents({
  reporter,
  state,
  file,
}: TransformerInput): Promise<unknown> {
  const awaitPromises: Array<Promise<unknown>> = [];

  traverse(file, {
    VariableDeclarator: {
      exit(path) {
        if (
          t.isArrowFunctionExpression(path.node.init) ||
          t.isFunctionExpression(path.node.init)
        ) {
          const { id, init: arrowFn } = path.node;
          const { params } = arrowFn;
          if (params.length === 1) {
            const [param] = params;

            if (
              (t.isIdentifier(id) &&
                t.isTSTypeAnnotation(param.typeAnnotation) &&
                t.isTSTypeReference(param.typeAnnotation.typeAnnotation) &&
                t.isIdentifier(param.typeAnnotation.typeAnnotation.typeName) &&
                param.typeAnnotation.typeAnnotation.typeName.name.endsWith(
                  "Props"
                )) ||
              (t.isIdentifier(id) &&
                t.isTSTypeAnnotation(param.typeAnnotation) &&
                t.isTSTypeAnnotation(arrowFn.returnType) &&
                t.isTSTypeReference(arrowFn.returnType.typeAnnotation) &&
                t.isTSQualifiedName(
                  arrowFn.returnType.typeAnnotation.typeName
                ) &&
                t.isIdentifier(
                  arrowFn.returnType.typeAnnotation.typeName.left,
                  {
                    name: "React",
                  }
                ) &&
                t.isIdentifier(
                  arrowFn.returnType.typeAnnotation.typeName.right
                ) &&
                ["ReactNode", "ReactElement"].includes(
                  arrowFn.returnType.typeAnnotation.typeName.right.name
                ))
            ) {
              // HACK(kevinb): We mutate the nodes directly instead of using `replaceWith`
              // because that function will end up in an infinite loop if we try to pass
              // it a node that contains any descendent nodes of the original node.
              id.typeAnnotation = t.tsTypeAnnotation(
                t.tsTypeReference(
                  t.tsQualifiedName(t.identifier("React"), t.identifier("FC")),
                  t.tsTypeParameterInstantiation([
                    param.typeAnnotation.typeAnnotation,
                  ])
                )
              );
              delete param.typeAnnotation;
              delete arrowFn.returnType;
            }
          }
        }
      },
    },
    FunctionDeclaration: {
      exit(path) {
        if (!t.isExportDefaultDeclaration(path.parent)) {
          const { id, params, returnType, body } = path.node;
          if (params.length === 1) {
            const [param] = params;

            if (
              (t.isIdentifier(id) &&
                t.isTSTypeAnnotation(param.typeAnnotation) &&
                t.isTSTypeReference(param.typeAnnotation.typeAnnotation) &&
                t.isIdentifier(param.typeAnnotation.typeAnnotation.typeName) &&
                param.typeAnnotation.typeAnnotation.typeName.name.endsWith(
                  "Props"
                )) ||
              (t.isIdentifier(id) &&
                t.isTSTypeAnnotation(param.typeAnnotation) &&
                t.isTSTypeAnnotation(returnType) &&
                t.isTSTypeReference(returnType.typeAnnotation) &&
                t.isTSQualifiedName(returnType.typeAnnotation.typeName) &&
                t.isIdentifier(returnType.typeAnnotation.typeName.left, {
                  name: "React",
                }) &&
                t.isIdentifier(returnType.typeAnnotation.typeName.right) &&
                ["ReactNode", "ReactElement"].includes(
                  returnType.typeAnnotation.typeName.right.name
                ))
            ) {
              // HACK(kevinb): We mutate the nodes directly instead of using `replaceWith`
              // because that function will end up in an infinite loop if we try to pass
              // it a node that contains any descendent nodes of the original node.
              id.typeAnnotation = t.tsTypeAnnotation(
                t.tsTypeReference(
                  t.tsQualifiedName(t.identifier("React"), t.identifier("FC")),
                  t.tsTypeParameterInstantiation([
                    param.typeAnnotation.typeAnnotation,
                  ])
                )
              );

              replaceWith(
                path,
                t.variableDeclaration("const", [
                  t.variableDeclarator(
                    id,
                    t.functionExpression(null, params, body)
                  ),
                ]),
                state.config.filePath,
                reporter
              );

              delete param.typeAnnotation;
              delete path.node.returnType;
            }
          }
        }
      },
    },
    ExportDefaultDeclaration: {
      exit(path) {
        const { node } = path;
        if (t.isFunctionDeclaration(node.declaration)) {
          const { id, params, returnType, body } = node.declaration;
          if (params.length === 1) {
            const [param] = params;

            if (
              (t.isIdentifier(id) &&
                t.isTSTypeAnnotation(param.typeAnnotation) &&
                t.isTSTypeReference(param.typeAnnotation.typeAnnotation) &&
                t.isIdentifier(param.typeAnnotation.typeAnnotation.typeName) &&
                param.typeAnnotation.typeAnnotation.typeName.name.endsWith(
                  "Props"
                )) ||
              (t.isIdentifier(id) &&
                t.isTSTypeAnnotation(param.typeAnnotation) &&
                t.isTSTypeAnnotation(returnType) &&
                t.isTSTypeReference(returnType.typeAnnotation) &&
                t.isTSQualifiedName(returnType.typeAnnotation.typeName) &&
                t.isIdentifier(returnType.typeAnnotation.typeName.left, {
                  name: "React",
                }) &&
                t.isIdentifier(returnType.typeAnnotation.typeName.right) &&
                ["ReactNode", "ReactElement"].includes(
                  returnType.typeAnnotation.typeName.right.name
                ))
            ) {
              // HACK(kevinb): We mutate the nodes directly instead of using `replaceWith`
              // because that function will end up in an infinite loop if we try to pass
              // it a node that contains any descendent nodes of the original node.
              id.typeAnnotation = t.tsTypeAnnotation(
                t.tsTypeReference(
                  t.tsQualifiedName(t.identifier("React"), t.identifier("FC")),
                  t.tsTypeParameterInstantiation([
                    param.typeAnnotation.typeAnnotation,
                  ])
                )
              );

              const newNodes = [
                t.variableDeclaration("const", [
                  t.variableDeclarator(
                    id,
                    t.functionExpression(null, params, body)
                  ),
                ]),
                t.exportDefaultDeclaration(t.identifier("Comp")),
              ];

              replaceWithMultiple(
                path,
                newNodes,
                state.config.filePath,
                reporter
              );

              delete param.typeAnnotation;
              delete node.declaration.returnType;
            }
          }
        }
      },
    },
  });

  return Promise.all(awaitPromises);
}
