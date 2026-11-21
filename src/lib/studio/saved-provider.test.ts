import { describe, expect, it } from "vitest";
import { AUTO_KEY_EMAILS } from "./saved-provider.functions";

describe("automatic owner connection", () => {
  it("includes Justin and Marleen only", () => {
    expect(AUTO_KEY_EMAILS).toEqual(["marleendeveloper@gmail.com", "justinspoden01@icloud.com"]);
    expect(AUTO_KEY_EMAILS.includes("guest@example.com")).toBe(false);
  });
});
