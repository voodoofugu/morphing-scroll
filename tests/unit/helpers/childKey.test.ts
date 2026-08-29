import { describe, it, expect } from "vitest";
import childKey from "@morphing-scroll/src/helpers/childKey";

/*
 * Ключ разворачивается один раз, на входе, поэтому и атрибут `ms-wrap-id`,
 * и `onRenderedKeysChange` отдают то, что написал пользователь, а не путь,
 * который дорисовал React.
 */
describe("childKey", () => {
  it("strips a root React key prefix ('.$Key')", () => {
    expect(childKey(".$myKey")).toBe("myKey");
  });

  it("extracts an explicit nested key after ':$'", () => {
    expect(childKey(".0:$Key")).toBe("Key");
  });

  it("decodes React key escapes (=0 -> =, =2 -> :)", () => {
    expect(childKey(".$user=2id=0x")).toBe("user:id=x");
  });

  it("leaves a generated position key alone", () => {
    expect(childKey(".0")).toBe(".0");
  });
});
