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

import { parseFileOps as parseReplace } from "./parse";
describe("delete then rewrite", () => {
  it("treats delete followed by one write of the same file as a replacement", () => {
    const ops = parseReplace('<delete path="/public/index.html" />\n<file path="/public/index.html">\n<div></div>\n</file>');
    expect(ops).toEqual([{ type: "write", path: "/public/index.html", content: "<div></div>\n" }]);
  });
  it("still rejects two writes of the same file", () => {
    expect(() => parseReplace('<file path="/a.ts">\n1\n</file><file path="/a.ts">\n2\n</file>')).toThrow(/Mehrdeutige/);
  });
});
