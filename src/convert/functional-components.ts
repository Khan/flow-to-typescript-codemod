import * as t from "@babel/types";
import traverse from "@babel/traverse";

import { TransformerInput } from "./transformer";
import { hasNullReturn } from "./utils/common";

export function transformFunctionalComponents({
  file,
}: TransformerInput): Promise<unknown> {
  const awaitPromises: Array<Promise<unknown>> = [];

  traverse(file, {
    FunctionExpression(path) {
      const { params, returnType, body } = path.node;

      const hasNull = hasNullReturn(
        body as t.BlockStatement,
        path.scope,
        path.parentPath
      );

      if (params.length === 0) {
        if (
          t.isTSTypeAnnotation(returnType) &&
          t.isTSTypeReference(returnType.typeAnnotation) &&
          t.isTSQualifiedName(returnType.typeAnnotation.typeName) &&
          t.isIdentifier(returnType.typeAnnotation.typeName.left, {
            name: "React",
          }) &&
          t.isIdentifier(returnType.typeAnnotation.typeName.right) &&
          returnType.typeAnnotation.typeName.right.name === "ReactNode"
        ) {
          path.node.returnType = createReturnType(hasNull);
        }
      } else if (params.length === 1) {
        const [param] = params;

        if (
          t.isTSTypeAnnotation(param.typeAnnotation) &&
          t.isTSTypeAnnotation(returnType) &&
          t.isTSTypeReference(returnType.typeAnnotation) &&
          t.isTSQualifiedName(returnType.typeAnnotation.typeName) &&
          t.isIdentifier(returnType.typeAnnotation.typeName.left, {
            name: "React",
          }) &&
          t.isIdentifier(returnType.typeAnnotation.typeName.right) &&
          returnType.typeAnnotation.typeName.right.name === "ReactNode"
        ) {
          // We always include a return type so that the output code conforms to
          // https://khanacademy.atlassian.net/wiki/spaces/ENG/pages/2201682700/TypeScript+Best+Practices#Functions-should-have-return-types
          path.node.returnType = createReturnType(hasNull);
        }
      }
    },
    ArrowFunctionExpression(path) {
      const { params, returnType, body } = path.node;

      const hasNull = hasNullReturn(
        body as t.BlockStatement,
        path.scope,
        path.parentPath
      );

      if (params.length === 0) {
        if (
          t.isTSTypeAnnotation(returnType) &&
          t.isTSTypeReference(returnType.typeAnnotation) &&
          t.isTSQualifiedName(returnType.typeAnnotation.typeName) &&
          t.isIdentifier(returnType.typeAnnotation.typeName.left, {
            name: "React",
          }) &&
          t.isIdentifier(returnType.typeAnnotation.typeName.right) &&
          returnType.typeAnnotation.typeName.right.name === "ReactNode"
        ) {
          path.node.returnType = createReturnType(hasNull);
        }
      } else if (params.length === 1) {
        const [param] = params;

        if (
          t.isTSTypeAnnotation(param.typeAnnotation) &&
          t.isTSTypeAnnotation(returnType) &&
          t.isTSTypeReference(returnType.typeAnnotation) &&
          t.isTSQualifiedName(returnType.typeAnnotation.typeName) &&
          t.isIdentifier(returnType.typeAnnotation.typeName.left, {
            name: "React",
          }) &&
          t.isIdentifier(returnType.typeAnnotation.typeName.right) &&
          returnType.typeAnnotation.typeName.right.name === "ReactNode"
        ) {
          // We always include a return type so that the output code conforms to
          // https://khanacademy.atlassian.net/wiki/spaces/ENG/pages/2201682700/TypeScript+Best+Practices#Functions-should-have-return-types
          path.node.returnType = createReturnType(hasNull);
        }
      }
    },
    FunctionDeclaration(path) {
      const { params, returnType, body } = path.node;

      const hasNull = hasNullReturn(
        body as t.BlockStatement,
        path.scope,
        path.parentPath
      );

      if (params.length === 0) {
        if (
          t.isTSTypeAnnotation(returnType) &&
          t.isTSTypeReference(returnType.typeAnnotation) &&
          t.isTSQualifiedName(returnType.typeAnnotation.typeName) &&
          t.isIdentifier(returnType.typeAnnotation.typeName.left, {
            name: "React",
          }) &&
          t.isIdentifier(returnType.typeAnnotation.typeName.right) &&
          returnType.typeAnnotation.typeName.right.name === "ReactNode"
        ) {
          path.node.returnType = createReturnType(hasNull);
        }
      } else if (params.length === 1) {
        const [param] = params;

        if (
          t.isTSTypeAnnotation(param.typeAnnotation) &&
          t.isTSTypeAnnotation(returnType) &&
          t.isTSTypeReference(returnType.typeAnnotation) &&
          t.isTSQualifiedName(returnType.typeAnnotation.typeName) &&
          t.isIdentifier(returnType.typeAnnotation.typeName.left, {
            name: "React",
          }) &&
          t.isIdentifier(returnType.typeAnnotation.typeName.right) &&
          returnType.typeAnnotation.typeName.right.name === "ReactNode"
        ) {
          // We always include a return type so that the output code conforms to
          // https://khanacademy.atlassian.net/wiki/spaces/ENG/pages/2201682700/TypeScript+Best+Practices#Functions-should-have-return-types
          path.node.returnType = createReturnType(hasNull);
        }
      }
    },
  });

  return Promise.all(awaitPromises);
}

function createReturnType(hasNull: boolean) {
  const reactElement = t.tsTypeReference(
    t.tsQualifiedName(
      // Using `React.ReactNode` as the return type is incompatible
      // with `React.FC<>` so we return `React.ReactElement`.  The
      // actual return type of `React.FC<>` is `React.ReactElement | null`.
      t.identifier("React"),
      t.identifier("ReactElement")
    )
  );

  return t.tsTypeAnnotation(
    hasNull ? t.tsUnionType([reactElement, t.tsNullKeyword()]) : reactElement
  );
}
