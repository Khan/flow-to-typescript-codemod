import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { types } from "recast";
import { TransformerInput } from "./transformer";

const flowComments = [
  "@flow",
  "$FlowFixMe",
  "$FlowIssue",
  "$FlowExpectedError",
  "$FlowIgnore",
];

type CommentKind =
  | types.namedTypes.Block
  | types.namedTypes.Line
  | types.namedTypes.CommentBlock
  | types.namedTypes.CommentLine;

const filterMapCommentKinds = (comments: CommentKind[] | null | undefined) => {
  return (
    comments
      ?.filter(
        (comment) => !flowComments.some((c) => comment.value.includes(c))
      )
      .map((comment) => {
        if (comment.value.includes("@noflow")) {
          return {
            ...comment,
            value: comment.value.replace(/@noflow/, "@ts-nocheck"),
          };
        }

        return comment;
      }) || comments
  );
};

const filterMapComments = (
  comments: readonly types.namedTypes.Comment[] | null
) => {
  return (
    comments
      ?.filter(
        (comment) => !flowComments.some((c) => comment.value.includes(c))
      )
      .map((comment) => {
        if (comment.value.includes("@noflow")) {
          return {
            ...comment,
            value: comment.value.replace(/@noflow/, "@ts-nocheck"),
          };
        }

        return comment;
      }) || comments
  );
};

/**
 * Scan through top level programs, or code blocks and remove Flow-specific comments
 */
const removeComments = (
  path: NodePath<t.Program> | NodePath<t.BlockStatement>
) => {
  if (path.node.body.length === 0) {
    return;
  }

  const nodes: Array<types.namedTypes.Node> = path.node.body;

  for (const rootNode of nodes) {
    rootNode.comments = filterMapCommentKinds(rootNode.comments);
  }
};

/**
 * Search the top level program, and blocks like functions and if statements for comments
 */
export function removeFlowComments({ file }: TransformerInput) {
  traverse(file, {
    Program(path) {
      removeComments(path);
    },
    BlockStatement(path) {
      removeComments(path);
    },
    JSXAttribute({ node }) {
      // @ts-expect-error: comments is readonly
      node.comments = filterMapComments(node.comments);
    },
  });
}
