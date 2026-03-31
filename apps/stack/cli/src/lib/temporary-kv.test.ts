import { temporaryKV } from "./temporary-kv";

describe("temporary-kv", () => {
  it("should set and get a value", async () => {
    // Arrange
    const key = Math.random().toString();
    const value = Math.random().toString();

    // Act
    await temporaryKV.set(key, value);

    // Assert
    const result = await temporaryKV.get(key);

    expect(result).toBe(value);

    const result2 = await temporaryKV.get("non-existent-key");

    expect(result2).toBe(null);
  });
});
