import dedent from "dedent";
import { transform } from "./utils/testing";

jest.mock("../runner/migration-reporter/migration-reporter.ts");
jest.mock("./flow/type-at-pos.ts");

describe("Converting functional components", () => {
  describe("Arrow functions", () => {
    it("adds React.FC<Props> type annotation, removes Props type annotation", async () => {
      const src = `const Comp = (props: Props) => { return <h1>Hello</h1> };`;
      const expected = `const Comp: React.FC<Props> = (props) => { return <h1>Hello</h1> };`;
      expect(await transform(src)).toBe(expected);
    });

    it("works with FooProps", async () => {
      const src = `const Comp = (props: FooProps) => { return <h1>Hello</h1> };`;
      const expected = `const Comp: React.FC<FooProps> = (props) => { return <h1>Hello</h1> };`;
      expect(await transform(src)).toBe(expected);
    });

    it("works on lambdas", async () => {
      const src = `const Comp = (props: FooProps) => <h1>Hello</h1>;`;
      const expected = `const Comp: React.FC<FooProps> = (props) => <h1>Hello</h1>;`;
      expect(await transform(src)).toBe(expected);
    });

    it("works with destructured props", async () => {
      const src = `const Comp = ({foo, bar}: Props) => { return <h1>Hello</h1> };`;
      const expected = dedent`const Comp: React.FC<Props> = ({
          foo,
          bar,
        }) => { return <h1>Hello</h1> };`;
      expect(await transform(src)).toBe(expected);
    });

    it("works on functions with inline props type and React.Node return type", async () => {
      const src = `const Comp = (props: {|foo: string, bar: string|}): React.Node => { return <h1>Hello</h1> };`;
      const expected = dedent`const Comp: React.FC<{
          foo: string,
          bar: string
        }> = props => { return <h1>Hello</h1> };`;
      expect(await transform(src)).toBe(expected);
    });

    it("works with components defined within another function", async () => {
      const src = dedent`const OuterComp = (props: OuterProps): React.Node => {
        const InnnerComp = (props: InnerProps) => <h1>Hello</h1>;
        return <InnerComp />;
      }`;
      const expected = dedent`const OuterComp: React.FC<OuterProps> = props => {
        const InnnerComp: React.FC<InnerProps> = (props) => <h1>Hello</h1>;
        return <InnerComp />;
      }`;
      expect(await transform(src)).toBe(expected);
    });
  });

  describe("Anonymous function expressions", () => {
    it("adds React.FC<Props> type annotation, removes Props type annotation", async () => {
      const src = `const Comp = function (props: Props) { return <h1>Hello</h1> };`;
      const expected = `const Comp: React.FC<Props> = function (props) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toBe(expected);
    });

    it("works with FooProps", async () => {
      const src = `const Comp = function (props: FooProps) { return <h1>Hello</h1> };`;
      const expected = `const Comp: React.FC<FooProps> = function (props) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toBe(expected);
    });

    it("works with destructured props", async () => {
      const src = `const Comp = function ({foo, bar}: Props) { return <h1>Hello</h1> };`;
      const expected = dedent`const Comp: React.FC<Props> = function ({
          foo,
          bar,
        }) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toBe(expected);
    });

    it("works on functions with inline props type and React.Node return type", async () => {
      const src = `const Comp = function (props: {|foo: string, bar: string|}): React.Node { return <h1>Hello</h1> };`;
      const expected = dedent`const Comp: React.FC<{
          foo: string,
          bar: string
        }> = function(props) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toBe(expected);
    });

    it("works with components defined within another function", async () => {
      const src = dedent`const OuterComp = function (props: OuterProps): React.Node {
        const InnnerComp = function (props: InnerProps) { return <h1>Hello</h1>; };
        return <InnerComp />;
      }`;
      const expected = dedent`const OuterComp: React.FC<OuterProps> = function(props) {
        const InnnerComp: React.FC<InnerProps> = function (props) { return <h1>Hello</h1>; };
        return <InnerComp />;
      }`;
      expect(await transform(src)).toBe(expected);
    });
  });

  describe("Function declarations", () => {
    it("converts it to an function expression", async () => {
      const src = `function Comp(props: Props) { return <h1>Hello</h1> };`;
      const expected = `const Comp: React.FC<Props> = function(props) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toBe(expected);
    });

    it("works with FooProps", async () => {
      const src = `function Comp(props: FooProps) { return <h1>Hello</h1> };`;
      const expected = `const Comp: React.FC<FooProps> = function(props) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toBe(expected);
    });

    it("works with destructured props", async () => {
      const src = `function Comp({foo, bar}: Props) { return <h1>Hello</h1> };`;
      const expected = dedent`const Comp: React.FC<Props> = function(
        {
          foo,
          bar,
        },
      ) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toBe(expected);
    });

    it("works on functions with inline props type and React.Node return type", async () => {
      const src = `function Comp(props: {|foo: string, bar: string|}): React.Node { return <h1>Hello</h1> };`;
      const expected = dedent`const Comp: React.FC<{
          foo: string,
          bar: string
        }> = function(props) { return <h1>Hello</h1> };`;
      expect(await transform(src)).toBe(expected);
    });

    it("works with components defined within another function", async () => {
      const src = dedent`function OuterComp(props: OuterProps): React.Node {
        function InnnerComp(props: InnerProps) { return <h1>Hello</h1>; };
        return <InnerComp />;
      }`;
      const expected = dedent`const OuterComp: React.FC<OuterProps> = function(props) {
        const InnnerComp: React.FC<InnerProps> = function(props) { return <h1>Hello</h1>; };
        return <InnerComp />;
      };`;
      expect(await transform(src)).toBe(expected);
    });
  });

  describe("Exporting function", () => {
    it("handles named exports", async () => {
      const src = `export function Comp(props: Props) { return <h1>Hello</h1> };`;
      const expected = `export const Comp: React.FC<Props> = function(props) { return <h1>Hello</h1> };;`;
      expect(await transform(src)).toBe(expected);
    });

    it("handles default exports with props param", async () => {
      const src = `export default function Comp(props: Props) { return <h1>Hello</h1> };`;
      const expected = dedent`const Comp: React.FC<Props> = function(props) { return <h1>Hello</h1> };
      export default Comp;`;
      expect(await transform(src)).toBe(expected);
    });

    it("handles default exports with inline props", async () => {
      const src = `export default function Comp(props: {|foo: string, bar: string|}): React.Node { return <h1>Hello</h1> };`;
      const expected = dedent`const Comp: React.FC<{
        foo: string,
        bar: string
      }> = function(props) { return <h1>Hello</h1> };
      export default Comp;`;
      expect(await transform(src)).toBe(expected);
    });

    it("handles default exports with destructured props", async () => {
      const src = `export default function Comp({foo, bar}: Props): React.Node { return <h1>Hello</h1> };`;
      const expected = dedent`const Comp: React.FC<Props> = function(
        {
          foo,
          bar,
        },
      ) { return <h1>Hello</h1> };
      export default Comp;`;
      expect(await transform(src)).toBe(expected);
    });
  });
});
