import * as t from "@babel/types";
import MigrationReporter from "../../runner/migration-reporter";
import { replaceWith } from "../utils/common";
import { State } from "../../runner/state";
import { ExpressTypes } from "../utils/type-mappings";

import type { NodePath } from "@babel/traverse";

export function maybeMigrateImportSpecifier(
  reporter: MigrationReporter,
  state: State,
  path: NodePath<t.ImportSpecifier>
): void {
  const { node } = path;
  const parentNode = path.parentPath.node;

  // @ts-expect-error: we know that the parent node has an importKind field on it
  const importKind = node.importKind || parentNode.importKind;

  if (
    importKind === "type" &&
    t.isIdentifier(node.imported) &&
    Object.keys(ExpressTypes).includes(node.imported.name)
  ) {
    // @ts-expect-error: TypeScript's doesn't refined based on `.includes()` calls
    const replacement = ExpressTypes[node.imported.name];

    const specifier = t.importSpecifier(
      t.identifier(replacement),
      t.identifier(replacement)
    );

    // Handles things like `import type {$Request as Req} from "express";`.
    if (node.local.name !== node.imported.name) {
      specifier.local.name = node.local.name;
    }

    // NOTE: `importKind` is always `null` on `ImportSpecifier` nodes
    // TODO: update the parser to try to fix this
    // Handles things like `import {type $Request} from "express";`.
    specifier.importKind = node.importKind;

    replaceWith(path, specifier, state.config.filePath, reporter);
  }
}
