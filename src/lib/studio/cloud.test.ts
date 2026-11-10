import { describe, expect, it } from "vitest";
import { cloudProjectSchema, publishSchema } from "./cloud";

describe("cloudProjectSchema", () => {
  const valid = { name: "Test", files: { "/App.tsx": "export default () => null;" }, messages: [] };

  it("akzeptiert ein gültiges Projekt", () => {
    expect(cloudProjectSchema.parse(valid).name).toBe("Test");
  });

  it("lehnt leeren Namen ab", () => {
    expect(() => cloudProjectSchema.parse({ ...valid, name: "  " })).toThrow();
  });

  it("lehnt ungültige cloudId ab", () => {
    expect(() => cloudProjectSchema.parse({ ...valid, cloudId: "keine-uuid" })).toThrow();
  });

  it("lehnt Nachrichten mit unbekannter Rolle ab", () => {
    expect(() => cloudProjectSchema.parse({ ...valid, messages: [{ id: "a", role: "admin", content: "x" }] })).toThrow();
  });
});

describe("publishSchema", () => {
  const uuid = "123e4567-e89b-12d3-a456-426614174000";

  it("akzeptiert gültigen Link-Namen", () => {
    expect(publishSchema.parse({ cloudId: uuid, slug: "meine-app-1", title: "App" }).slug).toBe("meine-app-1");
  });

  it("lehnt Großbuchstaben und Sonderzeichen ab", () => {
    expect(() => publishSchema.parse({ cloudId: uuid, slug: "Meine_App!", title: "App" })).toThrow();
  });

  it("lehnt zu kurze Link-Namen ab", () => {
    expect(() => publishSchema.parse({ cloudId: uuid, slug: "ab", title: "App" })).toThrow();
  });
});
