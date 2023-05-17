import {
  stateBuilder,
  transform,
  MockedMigrationReporter,
} from "../utils/testing";

jest.mock("../../runner/migration-reporter/migration-reporter.ts");

afterEach(MockedMigrationReporter.mockReset);

describe(".filter(Boolean) -> .filter(isTruthy)", () => {
  it("should handle a single .filter(Boolean)", async () => {
    const src = `let result = array.filter(Boolean);`;

    expect(await transform(src)).toMatchInlineSnapshot(`
      "import {isTruthy} from '@khanacademy/wonder-stuff-core';
      let result = array.filter(isTruthy);"
    `);
  });

  it("should handle a multiple .filter(Boolean)s", async () => {
    const src = `let result = array.filter(Boolean).filter(Boolean);`;

    expect(await transform(src)).toMatchInlineSnapshot(`
      "import {isTruthy} from '@khanacademy/wonder-stuff-core';
      let result = array.filter(isTruthy).filter(isTruthy);"
    `);
  });

  it("should handle inserting multiple imports", async () => {
    const src = `let result = array.filter(Boolean);`;

    expect(await transform(src, stateBuilder({ usedUtils: true })))
      .toMatchInlineSnapshot(`
      "import {Flow} from 'flow-to-typescript-codemod';
      import {isTruthy} from '@khanacademy/wonder-stuff-core';
      let result = array.filter(isTruthy);"
    `);
  });
});
