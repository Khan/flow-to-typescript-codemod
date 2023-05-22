import { transform } from "../utils/testing";

describe("transform type annotations", () => {
  it("$Values<T>", async () => {
    const src = `type Values = $Values<typeof T>`;

    expect(await transform(src)).toMatchInlineSnapshot(
      `"type Values = typeof T[keyof typeof T];"`
    );
  });

  it("declare function foo(x: number, y: string): boolean", async () => {
    const src = `declare function foo(x: number, y: string): boolean`;

    expect(await transform(src)).toMatchInlineSnapshot(
      `"declare function foo(x: number, y: string): boolean"`
    );
  });

  it("declare function foo<T: U = U>(x: T, y: T): T", async () => {
    const src = `declare function foo<T: U = U>(x: T, y: T): T`;

    expect(await transform(src)).toMatchInlineSnapshot(
      `"declare function foo<T extends U = U>(x: T, y: T): T"`
    );
  });

  it("function foo(x: number, y: string): boolean { return true; }", async () => {
    const src = `function foo(x: number, y: string): boolean { return true; }`;

    expect(await transform(src)).toMatchInlineSnapshot(
      `"function foo(x: number, y: string): boolean { return true; }"`
    );
  });

  it("handles returning object literals from arrow functions (simple)", async () => {
    const src = `const foo = (x, y) => ({x, y})`;

    expect(await transform(src)).toMatchInlineSnapshot(
      `"const foo = (x, y) => ({x, y})"`
    );
  });

  it("handles returning object literals from arrow functions (complex)", async () => {
    const src = `export const ErrorBoundary4: unknown = fixture(
      "with ErrorBoundary and custom handler (see console)",
      ({log}) => ({
          children: <BadComponent />,
          onError: (error) => {
              log("Handled an error.", error);
          },
      }),
  );`;

    expect(await transform(src)).toMatchInlineSnapshot(`
      "export const ErrorBoundary4: unknown = fixture(
            \\"with ErrorBoundary and custom handler (see console)\\",
            ({log}) => ({
                children: <BadComponent />,
                onError: (error) => {
                    log(\\"Handled an error.\\", error);
                },
            }),
        );"
    `);
  });
});
