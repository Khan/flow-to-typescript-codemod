import { fixEslintIssues } from "./fix-eslint-issues";

describe("fixEslintIssues", () => {
  it("should do something", () => {
    expect(true).toBe(true);
  });

  it("should replace no-unused-var with @typescript-eslint/no-unused-vars", () => {
    const input = `// @flow
const a = 5; // eslint-disable-line no-unused-vars
// eslint-disable-next-line no-unused-vars
const b = 10;`;

    const output = fixEslintIssues(input, "test.js", "test.ts");

    expect(output).toMatchInlineSnapshot(`
      "// @flow
      const a = 5; // eslint-disable-line @typescript-eslint/no-unused-vars
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const b = 10;"
    `);
  });

  it("should add eslint-disable static-service/require-stories if converting from .js to .tsx", () => {
    const input = `// @flow
console.log("hello, world!");`;

    const output = fixEslintIssues(input, "test.js", "test.tsx");

    expect(output).toMatchInlineSnapshot(`
      "/* eslint-disable static-service/require-stories */
      // @flow
      console.log(\\"hello, world!\\");"
    `);
  });
});
