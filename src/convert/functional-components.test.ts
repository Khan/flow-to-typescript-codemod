import dedent from "dedent";
import { transform } from "./utils/testing";

jest.mock("../runner/migration-reporter/migration-reporter.ts");
jest.mock("./flow/type-at-pos.ts");

describe("Converting functional components", () => {
  describe("Arrow functions", () => {
    it("adds React.FC<Props> type annotation, removes Props type annotation", async () => {
      const src = `const Comp = (props: Props) => { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(
        `"const Comp = (props): React.ReactElement => { return <h1>Hello</h1> };"`
      );
    });

    it("works with FooProps", async () => {
      const src = `const Comp = (props: FooProps) => { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(
        `"const Comp = (props): React.ReactElement => { return <h1>Hello</h1> };"`
      );
    });

    it("works on lambdas", async () => {
      const src = `const Comp = (props: FooProps) => <h1>Hello</h1>;`;
      expect(await transform(src)).toMatchInlineSnapshot(
        `"const Comp = (props): React.ReactElement => <h1>Hello</h1>;"`
      );
    });

    it("works with destructured props", async () => {
      const src = `const Comp = ({foo, bar}: Props) => { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(`
        "const Comp = (
          {
            foo,
            bar,
          },
        ): React.ReactElement => { return <h1>Hello</h1> };"
      `);
    });

    it("works on functions with inline props type and React.Node return type", async () => {
      const src = `const Comp = (props: {|foo: string, bar: string|}): React.Node => { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(
        `"const Comp = (props): React.ReactElement => { return <h1>Hello</h1> };"`
      );
    });

    it("works with components defined within another function", async () => {
      const src = dedent`const OuterComp = (props: OuterProps): React.Node => {
        const InnnerComp = (props: InnerProps) => <h1>Hello</h1>;
        return <InnerComp />;
      }`;
      expect(await transform(src)).toMatchInlineSnapshot(`
        "const OuterComp = (props): React.ReactElement => {
          const InnnerComp = (props): React.ReactElement => <h1>Hello</h1>;
          return <InnerComp />;
        }"
      `);
    });
  });

  describe("Anonymous function expressions", () => {
    it("adds React.FC<Props> type annotation, removes Props type annotation", async () => {
      const src = `const Comp = function (props: Props) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(
        `"const Comp = function(props): React.ReactElement { return <h1>Hello</h1> };"`
      );
    });

    it("works with FooProps", async () => {
      const src = `const Comp = function (props: FooProps) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(
        `"const Comp = function(props): React.ReactElement { return <h1>Hello</h1> };"`
      );
    });

    it("works with destructured props", async () => {
      const src = `const Comp = function ({foo, bar}: Props) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(`
        "const Comp = function(
          {
            foo,
            bar,
          },
        ): React.ReactElement { return <h1>Hello</h1> };"
      `);
    });

    it("works on functions with inline props type and React.Node return type", async () => {
      const src = `const Comp = function (props: {|foo: string, bar: string|}): React.Node { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(
        `"const Comp = function(props): React.ReactElement { return <h1>Hello</h1> };"`
      );
    });

    it("works with components defined within another function", async () => {
      const src = dedent`const OuterComp = function (props: OuterProps): React.Node {
        const InnnerComp = function (props: InnerProps) { return <h1>Hello</h1>; };
        return <InnerComp />;
      }`;
      expect(await transform(src)).toMatchInlineSnapshot(`
        "const OuterComp = function(props): React.ReactElement {
          const InnnerComp = function(props): React.ReactElement { return <h1>Hello</h1>; };
          return <InnerComp />;
        }"
      `);
    });
  });

  describe("Function declarations", () => {
    it("converts it to an function expression", async () => {
      const src = `function Comp(props: Props) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(
        `"const Comp = function(props): React.ReactElement { return <h1>Hello</h1> };"`
      );
    });

    it("works with FooProps", async () => {
      const src = `function Comp(props: FooProps) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(
        `"const Comp = function(props): React.ReactElement { return <h1>Hello</h1> };"`
      );
    });

    it("works with destructured props", async () => {
      const src = `function Comp({foo, bar}: Props) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(`
        "const Comp = function(
          {
            foo,
            bar,
          },
        ): React.ReactElement { return <h1>Hello</h1> };"
      `);
    });

    it("works on functions with inline props type and React.Node return type", async () => {
      const src = `function Comp(props: {|foo: string, bar: string|}): React.Node { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(
        `"const Comp = function(props): React.ReactElement { return <h1>Hello</h1> };"`
      );
    });

    it("works with components defined within another function", async () => {
      const src = dedent`function OuterComp(props: OuterProps): React.Node {
        function InnnerComp(props: InnerProps) { return <h1>Hello</h1>; };
        return <InnerComp />;
      }`;
      expect(await transform(src)).toMatchInlineSnapshot(`
        "const OuterComp = function(props): React.ReactElement {
          const InnnerComp = function(props): React.ReactElement { return <h1>Hello</h1>; };
          return <InnerComp />;
        };"
      `);
    });
  });

  describe("Exporting function", () => {
    it("handles named exports", async () => {
      const src = `export function Comp(props: Props) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(
        `"export const Comp = function(props): React.ReactElement { return <h1>Hello</h1> };;"`
      );
    });

    it("handles default exports with props param", async () => {
      const src = `export default function Comp(props: Props) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(`
        "const Comp = function(props): React.ReactElement { return <h1>Hello</h1> };
        export default Comp;"
      `);
    });

    it("handles default exports with inline props", async () => {
      const src = `export default function Comp(props: {|foo: string, bar: string|}): React.Node { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(`
        "const Comp = function(props): React.ReactElement { return <h1>Hello</h1> };
        export default Comp;"
      `);
    });

    it("handles default exports with destructured props", async () => {
      const src = `export default function Comp({foo, bar}: Props): React.Node { return <h1>Hello</h1> };`;
      expect(await transform(src)).toMatchInlineSnapshot(`
        "const Comp = function(
          {
            foo,
            bar,
          },
        ): React.ReactElement { return <h1>Hello</h1> };
        export default Comp;"
      `);
    });
  });
});
