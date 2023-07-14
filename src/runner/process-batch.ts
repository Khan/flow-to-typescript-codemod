import fs from "fs-extra";
import path from "path";
import * as t from "@babel/types";
import * as recast from "recast";
import { Options } from "recast";
import * as recastFlowParser from "recast/parsers/flow";
import { runTransforms } from "./run-transforms";
import MigrationReporter from "./migration-reporter";
import { ConvertCommandCliArgs } from "../cli/arguments";
import { defaultTransformerChain } from "../convert/default-transformer-chain";
import {
  annotateNoFlowTransformRunner,
  watermarkTransformRunner,
  importJestGlobalsTransformRunner,
} from "../convert/transform-runners";
import { State } from "./state";
import { ConfigurableTypeProvider } from "../convert/utils/configurable-type-provider";
import { hasDeclaration } from "../convert/utils/common";
import { FlowFileList, FlowFileType } from "./find-flow-files";
import { logger } from "./logger";
import { fixEslintIssues } from "./fix-eslint-issues";

export const FlowCommentRegex = /((\/){2,} ?)*@flow.*\n+/;

export const recastOptions: Options = {
  quote: "single",
  trailingComma: true,
  objectCurlySpacing: false,
};

export const renameFilePath = (
  targetFilePath: string,
  jsx: boolean
): string => {
  const tsFilePath = targetFilePath
    .replace(/_(test|testdata|flowtest|types)\.(jsx?)$/, ".$1.$2")
    .replace(".flowtest.", ".typestest.")
    .replace(/\.jsx?\.stories\./, ".stories.")
    .replace(/\.jsx?$/, jsx ? ".tsx" : ".ts");

  return tsFilePath;
};

/**
 * Process a batch of files, running transforms and renaming files
 */
export async function processBatchAsync(
  reporter: MigrationReporter,
  filePaths: FlowFileList,
  options: ConvertCommandCliArgs
) {
  await Promise.all(
    filePaths.map(async (elem) => {
      const { filePath, fileType } = elem;
      try {
        if (
          (fileType === FlowFileType.NO_FLOW && options.skipNoFlow) ||
          (fileType === FlowFileType.NO_ANNOTATION &&
            !options.convertUnannotated)
        ) {
          return;
        }

        const stats = fs.statSync(filePath);

        // Checks if a .ts override file exists and stops early
        // if there is one.
        if (
          fs.existsSync(
            filePath
              .replace("_test.", ".test.")
              .replace("_testdata.", ".testdata.")
              .replace("_flowtest.", ".typestest.")
              .replace(/\.jsx?$/, ".ts")
          )
        ) {
          reporter.foundOverrideFile(filePath);
          return;
        }

        // Checks if a .tsx override file exists and stops early
        // if there is one.
        if (
          fs.existsSync(
            filePath
              .replace("_test.", ".test.")
              .replace("_testdata.", ".testdata.")
              .replace("_flowtest.", ".typestest.")
              .replace(/\.jsx?$/, ".tsx")
          )
        ) {
          reporter.foundOverrideFile(filePath);
          return;
        }

        // Checks if a .d.ts override file exists and stops early
        // if there is one.
        // .d.ts files can live side-by-side with .js(x) files, providing
        // types for the .ts(x) files that import them so we need to
        // keep the .js(x) file around since that's what contains the
        // implementation.
        if (fs.existsSync(filePath.replace(/\.jsx?$/, ".d.ts"))) {
          reporter.foundDeclarationFile(filePath);
          return;
        }

        // ignore files in flow-typed directory
        if (filePath.includes("flow-typed")) {
          return;
        }

        const fileBuffer = await fs.readFile(filePath);

        const fileText = fileBuffer.toString("utf8");

        // Count the number of lines
        try {
          const lineCount = (fileText.match(/\n/g) || "").length + 1;
          reporter.reportLineCount(lineCount);
        } catch {
          // Line counting is not important. Ignore error.
        }

        const file: t.File = recast.parse(fileText, {
          parser: recastFlowParser,
        });
        const isTestFile = filePath.endsWith(".test.js");
        if (hasDeclaration(file)) {
          reporter.foundDeclarationFile(filePath);
          return;
        }
        const state: State = {
          hasJsx: false,
          usedUtils: false,
          usedIsTruthy: false,
          config: {
            filePath,
            isTestFile,
            watermark: options.tag,
            watermarkMessage: options.message,
            convertJSXSpreads: options.handleSpreadReactProps,
            dropImportExtensions: options.dropImportExtensions,
            keepPrivateTypes: options.keepPrivateTypes,
            forceTSX: options.forceTSX,
            disableFlow: options.disableFlow,
          },
          configurableTypeProvider: new ConfigurableTypeProvider({
            useStrictAnyFunctionType: options.useStrictAnyFunctionType,
            useStrictAnyObjectType: options.useStrictAnyObjectType,
          }),
        };
        const transforms = Array.from(defaultTransformerChain);

        if (options.watermark) {
          transforms.push(watermarkTransformRunner);
        }

        if (
          fileType === FlowFileType.NO_ANNOTATION &&
          options.convertUnannotated
        ) {
          transforms.push(annotateNoFlowTransformRunner);
        }

        if (filePath.includes("_test.")) {
          transforms.push(importJestGlobalsTransformRunner);
        }

        await runTransforms(reporter, state, file, transforms);
        if (!options.write) {
          return;
        }

        // Write the migrated file to a temporary file since we’re just testing at the moment.
        const newFileText = recast.print(file, recastOptions).code;

        const targetFilePath =
          options.target === ""
            ? filePath
            : filePath.replace(
                path.normalize(filePath),
                path.normalize(options.target)
              );

        const tsFilePath = renameFilePath(
          targetFilePath,
          state.hasJsx || options.forceTSX
        );

        if (isTestFile) {
          const fileName = path.basename(filePath);
          const tsFileName = path.basename(tsFilePath);
          const directoryPath = path.dirname(filePath);
          // since we are in a test file there may be a snapshot we also have to rename.
          const originalSnapPath = `${fileName}.snap`;
          const snapshotPath = path.join(
            directoryPath,
            "__snapshots__",
            originalSnapPath
          );
          if (await fs.pathExists(snapshotPath)) {
            const newSnapPath = path.join(
              directoryPath,
              "__snapshots__",
              `${tsFileName}.snap`
            );
            if (snapshotPath !== newSnapPath) {
              reporter.migrateSnapFile(
                filePath,
                originalSnapPath,
                snapshotPath
              );
              try {
                await fs.move(snapshotPath, newSnapPath);
              } catch (e) {
                reporter.error(filePath, e);
              }
            }
          }
        }

        // `{ mode: stats.mode }` is used to copy the file permissions from the original file.
        // This is important for node scripts which often have the executable bit set.
        await fs.outputFile(
          tsFilePath,
          fixEslintIssues(newFileText, filePath, targetFilePath),
          {
            mode: stats.mode,
          }
        );
      } catch (error) {
        // Report errors, but don’t crash the worker...
        reporter.error(filePath, error);
        logger.error(`Error found in ${filePath}: ${error}`, error);
      }
    })
  );
}
