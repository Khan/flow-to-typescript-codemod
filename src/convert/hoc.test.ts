import { transform } from "./utils/testing";

jest.mock("../runner/migration-reporter/migration-reporter.ts");

describe("transform HOC patterns", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("converts class-based components using HOCs", async () => {
    const src = `type Props = {|
        ...WithFooProps,
        ...WithBarProps,
        baz: boolean;
        qux: string;
      |};
      
      type DefaultProps = {
        qux: Props["qux"];
      };
      
      class InternalComponent extends React.Component<Props> {
        static defaultProps: DefaultProps = {
          qux: "hello",
        };
      
        render() {
          return (
            <div>
              foo: {this.props.foo}
              bar: {this.props.bar}
              baz: {this.props.baz}
              qux: {this.props.qux}
            </div>
          );
        }
      }
      
      type ExportProps = WithoutFoo<
        WithoutBar<
        React.ElementConfig<InternalComponent>
        >
      >;
  
      const Component = (withFoo(
        withBar(InternalComponent)
      ): React.ComponentType<ExportProps>);
  `;
    expect(await transform(src)).toMatchInlineSnapshot(`
      "type Props = (WithFooProps) & (WithBarProps) & {
        baz: boolean,
        qux: string
      };

      type DefaultProps = {
        qux: Props['qux']
      };

      class InternalComponent extends React.Component<Props> {
        static defaultProps: DefaultProps = {
          qux: \\"hello\\",
        };

        render() {
          return (
            <div>
              foo: {this.props.foo}
              bar: {this.props.bar}
              baz: {this.props.baz}
              qux: {this.props.qux}
            </div>
          );
        }
      }

      type ExportProps = WithoutFoo<WithoutBar<JSX.LibraryManagedAttributes<InternalComponent, React.ComponentProps<InternalComponent>>>>;

      const Component = (withFoo(
        withBar(InternalComponent)
      ) as React.ComponentType<ExportProps>);
        "
    `);
  });

  it("converts class-based components using HOCs", async () => {
    const src = `type Props = {|
        ...WithFooProps,
        ...WithBarProps,
        baz: boolean;
        qux: string;
      |};
      
      const InternalComponent = ({ foo, bar, baz, qux = "hello" }: Props) => {
        return (
          <div>
            foo: {foo}
            bar: {bar}
            baz: {baz}
            qux: {qux}
          </div>
        );
      };
      
      type ExportProps = WithoutFoo<
        WithoutBar<
        React.ElementConfig<InternalComponent>
        >
      >;
  
      const Component = (withFoo(
        withBar(InternalComponent)
      ): React.ComponentType<ExportProps>);
  `;
    expect(await transform(src)).toMatchInlineSnapshot(`
      "type Props = (WithFooProps) & (WithBarProps) & {
        baz: boolean,
        qux: string
      };

      const InternalComponent = (
        {
          foo,
          bar,
          baz,
          qux = \\"hello\\",
        }: Props,
      ): React.ReactElement => {
        return (
          <div>
            foo: {foo}
            bar: {bar}
            baz: {baz}
            qux: {qux}
          </div>
        );
      };

      type ExportProps = WithoutFoo<WithoutBar<JSX.LibraryManagedAttributes<InternalComponent, React.ComponentProps<InternalComponent>>>>;

      const Component = (withFoo(
        withBar(InternalComponent)
      ) as React.ComponentType<ExportProps>);
        "
    `);
  });
});
