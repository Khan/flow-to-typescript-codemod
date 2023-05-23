import * as t from "@babel/types";
import traverse from "@babel/traverse";
import { replaceWith, inheritLocAndComments } from "./utils/common";
import { migrateType } from "./migrate/type";
import { migrateTypeParameterDeclaration } from "./migrate/type-parameter";
import { maybeMigrateImportSpecifier } from "./migrate/import-specifier";
import { TransformerInput } from "./transformer";
import { MetaData } from "./migrate/metadata";
import { replaceWithMultiple } from "./utils/common";

/**
 * Convert type annotations for variables and parameters
 */
export function transformTypeAnnotations({
  reporter,
  state,
  file,
}: TransformerInput) {
  traverse(file, {
    TypeAnnotation(path) {
      if (
        path.parent.type === "Identifier" &&
        path.parentPath.parent.type === "DeclareFunction"
      ) {
        return;
      }

      const metaData: MetaData = { path };
      // Flow automatically makes function parameters that accept `void` not required.
      // However, TypeScript requires a parameter even if it is marked as void. So make all
      // parameters that accept `void` optional.
      if (
        path.parent.type === "Identifier" &&
        path.parentPath.parent.type !== "VariableDeclarator"
      ) {
        // `function f(x: ?T)` → `function f(x?: T | null)`
        if (path.node.typeAnnotation.type === "NullableTypeAnnotation") {
          path.parent.optional = true;

          const nullableType = t.unionTypeAnnotation([
            path.node.typeAnnotation.typeAnnotation,
            t.nullLiteralTypeAnnotation(),
          ]);
          inheritLocAndComments(path.node.typeAnnotation, nullableType);
          path.node.typeAnnotation = nullableType;
        }

        // `function f(x: T | void)` → `function f(x?: T)`
        if (
          path.node.typeAnnotation.type === "UnionTypeAnnotation" &&
          path.node.typeAnnotation.types.some(
            (unionType) => unionType.type === "VoidTypeAnnotation"
          )
        ) {
          path.parent.optional = true;
          path.node.typeAnnotation.types =
            path.node.typeAnnotation.types.filter(
              (unionType) => unionType.type !== "VoidTypeAnnotation"
            );
        }
      }

      // Return types might be transformed differently to detect functional components
      if (
        path.parentPath.type === "ArrowFunctionExpression" ||
        path.parentPath.type === "FunctionDeclaration" ||
        path.parentPath.type === "ClassMethod"
      ) {
        metaData.returnType = true;
      }

      replaceWith(
        path,
        t.tsTypeAnnotation(
          migrateType(reporter, state, path.node.typeAnnotation, metaData)
        ),
        state.config.filePath,
        reporter
      );
    },

    TypeParameterDeclaration(path) {
      replaceWith(
        path,
        migrateTypeParameterDeclaration(reporter, state, path.node),
        state.config.filePath,
        reporter
      );
    },

    ImportSpecifier(path) {
      maybeMigrateImportSpecifier(reporter, state, path);
    },

    ImportDeclaration(path) {
      const { node } = path;
      // @ts-expect-error: SourceLocation doesn't include 'tokens' even though it's there
      const isTypeofImport = node.loc?.tokens.some((token) => {
        return token.value === "typeof";
      });

      if (isTypeofImport) {
        const { specifiers, source } = node;

        const replacements = specifiers.flatMap((specifier) => {
          if (specifier.type === "ImportSpecifier") {
            const { local, imported } = specifier;
            if (imported.type !== "Identifier") {
              return [];
            }
            return [
              t.tsTypeAliasDeclaration(
                local,
                undefined,
                t.tsTypeQuery(t.tsImportType(source, imported))
              ),
            ];
          } else if (specifier.type === "ImportDefaultSpecifier") {
            const { local } = specifiers[0];
            return [
              t.tsTypeAliasDeclaration(
                local,
                undefined,
                t.tsTypeQuery(t.tsImportType(source))
              ),
            ];
          } else {
            return [];
          }
        });

        replaceWithMultiple(
          path,
          replacements,
          state.config.filePath,
          reporter
        );
      }
    },

    DeclareFunction(path) {
      const { typeAnnotation } = path.node.id;

      if (typeAnnotation?.type !== "TypeAnnotation") {
        return;
      }

      const functionTypeAnnotation = typeAnnotation.typeAnnotation;

      if (functionTypeAnnotation.type !== "FunctionTypeAnnotation") {
        return;
      }

      const typeParameters = functionTypeAnnotation.typeParameters
        ? t.tsTypeParameterDeclaration(
            functionTypeAnnotation.typeParameters.params.map((param) => {
              const bound = param.bound
                ? migrateType(reporter, state, param.bound.typeAnnotation)
                : null;
              const _default = param.default
                ? migrateType(reporter, state, param.default)
                : null;
              return t.tsTypeParameter(bound, _default, param.name);
            })
          )
        : null;

      const params = functionTypeAnnotation.params.map((param) => {
        // Flow allows anonymous params, but TS does not.
        const result = t.identifier(param.name?.name ?? "_");
        result.typeAnnotation = t.tsTypeAnnotation(
          migrateType(reporter, state, param.typeAnnotation)
        );
        return result;
      });
      const returnType = migrateType(
        reporter,
        state,
        functionTypeAnnotation.returnType
      );

      const replacement = t.tsDeclareFunction(
        t.identifier(path.node.id.name),
        typeParameters,
        params,
        t.tsTypeAnnotation(returnType)
      );
      replacement.declare = true;

      replaceWith(path, replacement, state.config.filePath, reporter);
    },
  });
}
