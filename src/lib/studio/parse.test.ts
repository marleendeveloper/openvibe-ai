import { describe, it, expect } from "vitest";
import { parseFileOps } from "./parse";

describe("parseFileOps", () => {
  it("parses writes, strips fences and normalizes paths", () => {
    const ops = parseFileOps('Plan\n<file path="App.tsx">\n```tsx\nexport default 1;\n```\n</file>\n<delete path="/old.ts" />');
    expect(ops).toEqual([
      { type: "write", path: "/App.tsx", content: "export default 1;\n" },
      { type: "delete", path: "/old.ts" },
    ]);
  });
  it("ignores unfinished file blocks", () => {
    expect(parseFileOps('<file path="/a.ts">half')).toEqual([]);
  });
});
