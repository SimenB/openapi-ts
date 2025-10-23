import { describe, expect, it } from 'vitest';

import { buildGraph } from '../graph';

// simple logger stub for buildGraph
const loggerStub = {
  timeEvent: () => ({ timeEnd: () => {} }),
} as any;

describe('buildGraph', () => {
  it('computes referenced and transitive dependencies for validators-circular-ref.json', async () => {
    const mod = await import(
      '../../../../../../../specs/3.1.x/validators-circular-ref.json'
    );
    const spec = (mod as any).default ?? mod;

    const { graph } = buildGraph(spec, loggerStub);

    const foo = '#/components/schemas/Foo';
    const bar = '#/components/schemas/Bar';
    const baz = '#/components/schemas/Baz';
    const qux = '#/components/schemas/Qux';

    // Foo has a child property that $ref's Bar, so Foo should have Bar in subtreeDependencies
    expect(graph.subtreeDependencies.get(foo)).toBeDefined();
    expect(Array.from(graph.subtreeDependencies.get(foo)!).sort()).toEqual(
      [bar].sort(),
    );

    // Foo transitively depends on Bar (via the child), so transitiveDependencies should include Bar
    expect(graph.transitiveDependencies.get(foo)).toBeDefined();
    expect(Array.from(graph.transitiveDependencies.get(foo)!).sort()).toEqual(
      [bar].sort(),
    );

    // Bar references itself via an array item; Bar should reference Bar
    expect(Array.from(graph.subtreeDependencies.get(bar)!).sort()).toEqual(
      [bar].sort(),
    );

    // Baz and Qux form a mutual $ref cycle; each should reference the other in subtreeDependencies
    expect(Array.from(graph.subtreeDependencies.get(baz)!).sort()).toEqual(
      [qux].sort(),
    );
    expect(Array.from(graph.subtreeDependencies.get(qux)!).sort()).toEqual(
      [baz].sort(),
    );

    // Qux node should exist and have a direct dependency to Baz (node-level $ref)
    expect(graph.nodes.has(qux)).toBe(true);
    expect(graph.nodeDependencies.get(qux)).toBeDefined();
    expect(Array.from(graph.nodeDependencies.get(qux)!).sort()).toEqual(
      [baz].sort(),
    );

    // Qux transitive deps should include Baz (and vice-versa because of the cycle)
    expect(graph.transitiveDependencies.get(qux)).toBeDefined();
    expect(Array.from(graph.transitiveDependencies.get(qux)!).sort()).toEqual(
      [baz].sort(),
    );

    // Reverse dependencies should reflect the mutual references
    expect(graph.reverseNodeDependencies.get(qux)).toBeDefined();
    expect(Array.from(graph.reverseNodeDependencies.get(qux)!).sort()).toEqual(
      [baz].sort(),
    );
    expect(Array.from(graph.reverseNodeDependencies.get(baz)!).sort()).toEqual(
      [qux].sort(),
    );
  });

  it('handles a small hand-constructed tree with child-level $ref', () => {
    const spec = {
      components: {
        schemas: {
          A: {
            properties: { p: { $ref: '#/components/schemas/B' } },
            type: 'object',
          },
          B: { type: 'object' },
        },
      },
    };

    const { graph } = buildGraph(spec, loggerStub);

    const a = '#/components/schemas/A';
    const b = '#/components/schemas/B';

    expect(Array.from(graph.subtreeDependencies.get(a)!).sort()).toEqual(
      [b].sort(),
    );
    expect(Array.from(graph.transitiveDependencies.get(a)!).sort()).toEqual(
      [b].sort(),
    );
    // reverseNodeDependencies should record that b is referenced by the property child as well
    expect(graph.reverseNodeDependencies.get(b)).toBeDefined();
    expect(
      Array.from(graph.reverseNodeDependencies.get(b)!).some((p) =>
        p.startsWith(a),
      ),
    ).toBe(true);
  });
});
