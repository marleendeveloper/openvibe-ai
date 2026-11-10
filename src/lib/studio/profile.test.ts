import { describe, expect, it } from "vitest";
import { profileSchema } from "./profile";
describe("private profile validation", () => {
  it("rejects a caller-supplied user id", () => {
    expect(() =>
      profileSchema.parse({ display_name: "Test", bio: "", id: "another-user" }),
    ).toThrow();
  });
  it("rejects role changes through the profile", () => {
    expect(() => profileSchema.parse({ display_name: "Test", bio: "", role: "admin" })).toThrow();
  });
});
