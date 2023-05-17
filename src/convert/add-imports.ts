import * as t from "@babel/types";
import traverse from "@babel/traverse";
import { TransformerInput } from "./transformer";

/**
 * If any of the transforms used a utility type, we need to import them
 * @param state
 * @param file
 */
export function addImports({ state, file }: TransformerInput) {
  traverse(file, {
    Program: {
      exit(path) {
        const newImportDecls = [];
        if (state.usedUtils) {
          const importDeclaration = t.importDeclaration(
            [t.importSpecifier(t.identifier("Flow"), t.identifier("Flow"))],
            t.stringLiteral("flow-to-typescript-codemod")
          );
          newImportDecls.push(importDeclaration);
        }
        if (state.usedIsTruthy) {
          const importDeclaration = t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier("isTruthy"),
                t.identifier("isTruthy")
              ),
            ],
            t.stringLiteral("@khanacademy/wonder-stuff-core")
          );
          newImportDecls.push(importDeclaration);
        }

        if (newImportDecls.length > 0) {
          path.node.body = [...newImportDecls, ...path.node.body];
        }
      },
    },
  });
}
