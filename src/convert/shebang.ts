import traverse from "@babel/traverse";
import { TransformerInput } from "./transformer";

/**
 * Rewrite `node -r @babel/register` shebangs to use `@swc-node/register`.
 */
export function shebang({ file }: TransformerInput) {
  traverse(
    file,
    {
      Program(path) {
        const { interpreter } = path.node;
        if (interpreter) {
          if (interpreter.value === "/usr/bin/env -S node -r @babel/register") {
            interpreter.value = "/usr/bin/env -S node -r @swc-node/register";
          }
        }
      },
    },
    undefined
  );
}
