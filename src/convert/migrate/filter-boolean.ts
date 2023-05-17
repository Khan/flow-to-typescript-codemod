import * as t from "@babel/types";
import traverse from "@babel/traverse";
import { TransformerInput } from "../transformer";

/**
 * Converts .filter(Boolean) to .filter(isTruthy)
 *
 * This is necessary because `.filter(Boolean)` in TS doesn't behave the same
 * way it does in Flow.  The replacement, `isTruthy`, is a predicate type which
 * does behave the same way.  Unfortunately, this solution only works in TS which
 * is why we're having the codemod make this change instead of doing it ourselves
 * pre-emptively.
 */
export function transformFilterBoolean({ state, file }: TransformerInput) {
  traverse(file, {
    CallExpression(path) {
      const { node } = path;
      const { callee, arguments: args } = node;
      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.property, { name: "filter" }) &&
        t.isIdentifier(args[0], { name: "Boolean" })
      ) {
        args[0] = t.identifier("isTruthy");
        // This value is conusmed in add-imports.ts.
        state.usedIsTruthy = true;
      }
    },
  });
}
