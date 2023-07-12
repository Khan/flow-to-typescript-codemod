import { transform } from "./utils/testing";

describe("jest globals", () => {
  it("should update 'node -r @babel/register' shebang to use '@swc-node/register'", async () => {
    const src = `#!/usr/bin/env -S node -r @babel/register
console.log("hello, world!");`;

    expect(await transform(src)).toMatchInlineSnapshot(`
      "#!/usr/bin/env -S node -r @swc-node/register

      console.log(\\"hello, world!\\");"
    `);
  });

  it("should work with a comment on the next line", async () => {
    const src = `#!/usr/bin/env -S node -r @babel/register
/* eslint-disable no-console */
// @flow
import yargs from "yargs";
import {entries, keys} from "@khanacademy/wonder-stuff-core";`;

    expect(await transform(src)).toMatchInlineSnapshot();
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
