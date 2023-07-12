import traverse from "@babel/traverse";
import { TransformerInput } from "./transformer";

/**
 * Rewrite `node -r @babel/register` shebangs to use `@swc-node/register`.
 */
export function shebang({ file }: TransformerInput) {
  traverse(
    file,
    {
      InterpreterDirective(path) {
        const { node } = path;

        if (node.value === "#!/usr/bin/env -S node -r @babel/register") {
          node.value = "#!/usr/bin/env -S node -r @swc-node/register";
        }
      },
    },
    undefined
  );
}
