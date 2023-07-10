import { transform, stateBuilder } from "./utils/testing";

describe("jest globals", () => {
  it("should import a single global in _test.jsx files", async () => {
    const src = `expect(true).toBe(true);`;

    expect(
      await transform(
        src,
        stateBuilder({ config: { filePath: "foo_test.jsx" } })
      )
    ).toMatchInlineSnapshot(`
      "import {expect} from '@jest/globals';
      expect(true).toBe(true);"
    `);
  });

  it("should import multiple globals in _test.js files", async () => {
    const src = `describe("foo", () => { expect(true).toBe(true); });`;

    expect(
      await transform(
        src,
        stateBuilder({ config: { filePath: "foo_test.js" } })
      )
    ).toMatchInlineSnapshot(`
      "import {describe, expect} from '@jest/globals';
      describe(\\"foo\\", () => { expect(true).toBe(true); });"
    `);
  });

  it("should not import globals in non-test files", async () => {
    const src = `expect(true).toBe(true);`;

    expect(
      await transform(src, stateBuilder({ config: { filePath: "foo.jsx" } }))
    ).toMatchInlineSnapshot(`"expect(true).toBe(true);"`);
  });

  it("should not re-import globals in _test.js files that have already been imported", async () => {
    const src = `import {expect} from "@jest/globals";
    import {describe} from "~/testing/jest-globals";
    describe("foo", () => { expect(true).toBe(true); });`;

    expect(
      await transform(
        src,
        stateBuilder({ config: { filePath: "foo_test.js" } })
      )
    ).toMatchInlineSnapshot(`
      "import {expect} from \\"@jest/globals\\";
          import {describe} from \\"~/testing/jest-globals\\";
          describe(\\"foo\\", () => { expect(true).toBe(true); });"
    `);
  });
});
