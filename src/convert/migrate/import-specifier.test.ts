import { transform } from "../utils/testing";

describe("transform typeof imports", () => {
  it("import typeof Foo from './foo'", async () => {
    const src = `import typeof Foo from './foo'`;

    expect(await transform(src)).toMatchInlineSnapshot(
      `"type Foo = typeof import('./foo');"`
    );
  });

  it("named import", async () => {
    const src = `import typeof {Foo} from './foo'`;

    expect(await transform(src)).toMatchInlineSnapshot(
      `"type Foo = typeof import('./foo').Foo;"`
    );
  });

  it("renamed import", async () => {
    const src = `import typeof {Foo as Bar} from './foo'`;

    expect(await transform(src)).toMatchInlineSnapshot(
      `"type Bar = typeof import('./foo').Foo;"`
    );
  });

  it("multiple named imports", async () => {
    const src = `import typeof {Foo as Bar, Baz} from './foo'`;

    expect(await transform(src)).toMatchInlineSnapshot(`
      "type Bar = typeof import('./foo').Foo;
      type Baz = typeof import('./foo').Baz;"
    `);
  });
});
