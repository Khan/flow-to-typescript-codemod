import { transform } from "./utils/testing";

describe("jest globals", () => {
  it("should update 'node -r @babel/register' shebang to use '@swc-node/register'", async () => {
    const src = `#!/usr/bin/env -S node -r @swc-node/register
    console.log("hello, world!");`;

    expect(await transform(src)).toMatchInlineSnapshot(`
      "#!/usr/bin/env -S node -r @swc-node/register
          console.log(\\"hello, world!\\");"
    `);
  });

  it("should not update other shebangs", async () => {
    const src = `#!/usr/bin/env node
    console.log("hello, world!");`;

    expect(await transform(src)).toMatchInlineSnapshot(`
      "#!/usr/bin/env node
          console.log(\\"hello, world!\\");"
    `);
  });
});
