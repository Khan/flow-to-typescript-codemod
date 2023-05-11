import { renameFilePath } from "./process-batch";

describe("renameFilePath", () => {
  it.each`
    inPath                           | jsx      | outPath
    ${"./src/foo_bar.js"}            | ${false} | ${"./src/foo_bar.ts"}
    ${"./src/foo_test.js"}           | ${false} | ${"./src/foo.test.ts"}
    ${"./src/foo.jsx.stories.js"}    | ${false} | ${"./src/foo.stories.ts"}
    ${"./src/foo.jsx.stories.js"}    | ${true}  | ${"./src/foo.stories.tsx"}
    ${"./src/__tests__/foo_bar.js"}  | ${false} | ${"./src/__tests__/foo_bar.ts"}
    ${"./src/__tests__/foo_test.js"} | ${false} | ${"./src/__tests__/foo.test.ts"}
    ${"./src/__tests__/foo_test.js"} | ${true}  | ${"./src/__tests__/foo.test.tsx"}
    ${"./src/foo_testdata.js"}       | ${false} | ${"./src/foo.testdata.ts"}
    ${"./src/foo_flowtest.js"}       | ${false} | ${"./src/foo.typestest.ts"}
    ${"./src/foo_types.js"}          | ${false} | ${"./src/foo.types.ts"}
  `("inPath: $inPath, jsx: ${jsx} -> $outPath", ({ inPath, jsx, outPath }) => {
    expect(renameFilePath(inPath, jsx)).toEqual(outPath);
  });
});
