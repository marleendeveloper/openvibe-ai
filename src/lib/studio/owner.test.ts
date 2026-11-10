import { it, expect } from "vitest";
import { isOwnerEmail } from "./owner";
it("allows the owner email (any case)", () => expect(isOwnerEmail("MarleenDeveloper@gmail.com")).toBe(true));
it("blocks every other account", () => expect(isOwnerEmail("charline345@icloud.com")).toBe(false));
it("blocks missing email", () => expect(isOwnerEmail(undefined)).toBe(false));
it("allows the second owner email for magic-link access", () => expect(isOwnerEmail("Justinspoden01@icloud.com")).toBe(true));
