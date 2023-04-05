import * as t from "@babel/types";
import traverse from "@babel/traverse";

import { TransformerInput } from "./transformer";
import { replaceWith, replaceWithMultiple } from "./utils/common";

export function transformFunctionalComponents({
  reporter,
  state: globalState,
  file,
}: TransformerInput): Promise<unknown> {
  const awaitPromises: Array<Promise<unknown>> = [];

  // We only want to add `React.ReactElement` as a return type on functions that
  // we know are React components.  Checking if there's a param named `props` is
  // not enough to determine this since `mapPropsToState` and `mapPropsToDispatch`
  // both take `props` as param but are not components.  In order to determine if
  // a function is a component, we also need to check if returns any JSX.  In order
  // to do this, we need to track if there's any JSXElements in each scope.
  const initialState: { scopes: Array<{ jsx: boolean }> } = { scopes: [] };

  traverse(
    file,
    {
      JSXElement: {
        exit(_, state) {
          if (state.scopes.length > 0) {
            state.scopes[state.scopes.length - 1].jsx = true;
          }
        },
      },
      FunctionExpression: {
        enter(_, state) {
          state.scopes.push({ jsx: false });
        },
        exit(path, state) {
          const containsJsx = state.scopes[state.scopes.length - 1].jsx;
          // We only want to modify the node if the function contains JSX otherwise
          // it messes up the conversion of other functions, even if `containsJsx` is
          // set to false.
          if (containsJsx) {
            // @ts-expect-error: containsJsx is a custom property we're adding
            path.node.containsJsx = containsJsx;
          }
          state.scopes.pop();
        },
      },
      ArrowFunctionExpression: {
        enter(_, state) {
          state.scopes.push({ jsx: false });
        },
        exit(path, state) {
          const containsJsx = state.scopes[state.scopes.length - 1].jsx;
          // We only want to modify the node if the function contains JSX otherwise
          // it messes up the conversion of other functions, even if `containsJsx` is
          // set to false.
          if (containsJsx) {
            // @ts-expect-error: containsJsx is a custom property we're adding
            path.node.containsJsx = containsJsx;
          }
          state.scopes.pop();
        },
      },
      VariableDeclarator: {
        exit(path) {
          if (
            (t.isArrowFunctionExpression(path.node.init) ||
              t.isFunctionExpression(path.node.init)) &&
            // @ts-expect-error: containsJsx is a custom property we're adding
            path.node.init.containsJsx
          ) {
            const { id, init: arrowFn } = path.node;
            const { params } = arrowFn;
            if (params.length === 1) {
              const [param] = params;

              if (
                (t.isIdentifier(id) &&
                  t.isTSTypeAnnotation(param.typeAnnotation) &&
                  t.isTSTypeReference(param.typeAnnotation.typeAnnotation) &&
                  t.isIdentifier(
                    param.typeAnnotation.typeAnnotation.typeName
                  ) &&
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
                // We always include a return type so that the output code conforms to
                // https://khanacademy.atlassian.net/wiki/spaces/ENG/pages/2201682700/TypeScript+Best+Practices#Functions-should-have-return-types
                arrowFn.returnType = createReturnType();
              }
            }
          }
        },
      },
      FunctionDeclaration: {
        enter(_, state) {
          state.scopes.push({ jsx: false });
        },
        exit(path, state) {
          if (!t.isExportDefaultDeclaration(path.parent)) {
            const { id, params, returnType, body } = path.node;
            if (params.length === 1) {
              const [param] = params;

              if (
                state.scopes.length > 0 &&
                !state.scopes[state.scopes.length - 1].jsx
              ) {
                return;
              }

              if (
                (t.isIdentifier(id) &&
                  t.isTSTypeAnnotation(param.typeAnnotation) &&
                  t.isTSTypeReference(param.typeAnnotation.typeAnnotation) &&
                  t.isIdentifier(
                    param.typeAnnotation.typeAnnotation.typeName
                  ) &&
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
                const fn = t.functionExpression(null, params, body);

                // We always include a return type so that the output code conforms to
                // https://khanacademy.atlassian.net/wiki/spaces/ENG/pages/2201682700/TypeScript+Best+Practices#Functions-should-have-return-types
                fn.returnType = createReturnType();

                replaceWith(
                  path,
                  t.variableDeclaration("const", [
                    t.variableDeclarator(id, fn),
                  ]),
                  globalState.config.filePath,
                  reporter
                );
              }
            }
          }

          state.scopes.pop();
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
                  t.isIdentifier(
                    param.typeAnnotation.typeAnnotation.typeName
                  ) &&
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
                const fn = t.functionExpression(null, params, body);

                // We always include a return type so that the output code conforms to
                // https://khanacademy.atlassian.net/wiki/spaces/ENG/pages/2201682700/TypeScript+Best+Practices#Functions-should-have-return-types
                fn.returnType = createReturnType();

                const newNodes = [
                  t.variableDeclaration("const", [
                    t.variableDeclarator(id, fn),
                  ]),
                  t.exportDefaultDeclaration(t.identifier(id.name)),
                ];

                replaceWithMultiple(
                  path,
                  newNodes,
                  globalState.config.filePath,
                  reporter
                );
              }
            }
          }
        },
      },
    },
    undefined,
    initialState
  );

  return Promise.all(awaitPromises);
}

function createReturnType() {
  return t.tsTypeAnnotation(
    t.tsTypeReference(
      t.tsQualifiedName(
        // Using `React.ReactNode` as the return type is incompatible
        // with `React.FC<>` so we return `React.ReactElement`.  The
        // actual return type of `React.FC<>` is `React.ReactElement | null`.
        t.identifier("React"),
        t.identifier("ReactElement")
      )
    )
  );
}
