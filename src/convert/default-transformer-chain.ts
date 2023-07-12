import {
  declarationsTransformRunner,
  expressionTransformRunner,
  jsxTransformRunner,
  hasJsxTransformRunner,
  importTransformRunner,
  jsxSpreadTransformRunner,
  patternTransformRunner,
  privateTypeTransformRunner,
  typeAnnotationTransformRunner,
  removeFlowCommentTransformRunner,
  functionalComponentTransformerRunner,
  filterBooleanTranforRunner,
  shebangTransformRunner,
} from "./transform-runners";
import { Transformer } from "./transformer";

/**
 * Default chain of babel transforms to run. Order will be preserved.
 */
export const defaultTransformerChain: readonly Transformer[] = [
  hasJsxTransformRunner,
  jsxTransformRunner,
  privateTypeTransformRunner,
  expressionTransformRunner,
  declarationsTransformRunner,
  typeAnnotationTransformRunner,
  patternTransformRunner,
  jsxSpreadTransformRunner,
  removeFlowCommentTransformRunner,
  functionalComponentTransformerRunner,
  filterBooleanTranforRunner,
  shebangTransformRunner,

  // This transform must go last since it looks at `state` which can
  // be modified by any other transformer.
  importTransformRunner,
];
