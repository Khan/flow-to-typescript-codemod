import { transform } from "../utils/testing";

describe("transform type annotations", () => {
  it("$Values<T>", async () => {
    const src = `type Values = $Values<typeof T>`;

    expect(await transform(src)).toMatchInlineSnapshot(
      `"type Values = typeof T[keyof typeof T];"`
    );
  });
});
