import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { TransformerInput } from "./transformer";

/**
 * Import jest globals from @jest/globals.
 */
export function importJestGlobals({ file }: TransformerInput) {
  const state = {
    usedGlobals: new Set<string>(),
    importedGlobals: new Set<string>(),
  };
  const GLOBALS = [
    "expect",
    "it",
    "test",
    "describe",
    "beforeEach",
    "afterEach",
    "beforeAll",
    "afterAll",
  ];
  traverse(
    file,
    {
      ImportSpecifier(path, state) {
        const { node } = path;
        const parent = path.parentPath.node;
        if (
          parent.type === "ImportDeclaration" &&
          (parent.source.value === "@jest/globals" ||
            parent.source.value.endsWith("/jest-globals")) &&
          node.imported.type === "Identifier" &&
          GLOBALS.includes(node.imported.name)
        ) {
          state.importedGlobals.add(node.imported.name);
        }
      },
      CallExpression(path, state) {
        const { node } = path;
        if (
          node.callee.type === "Identifier" &&
          GLOBALS.includes(node.callee.name) &&
          !state.importedGlobals.has(node.callee.name)
        ) {
          state.usedGlobals.add(node.callee.name);
        }
      },
      Program: {
        exit(path) {
          if (state.usedGlobals.size === 0) {
            return;
          }

          const specifiers = [];
          for (const global of state.usedGlobals) {
            specifiers.push(
              t.importSpecifier(t.identifier(global), t.identifier(global))
            );
          }

          const importDeclaration = t.importDeclaration(
            specifiers,
            t.stringLiteral("@jest/globals")
          );
          path.node.body = [importDeclaration, ...path.node.body];
        },
      },
    },
    undefined,
    state
  );
}
