import crypto from "crypto";
import { unpack } from "./utils";

const getKeyHash = (key: Buffer) => {
  return crypto.createHash("sha256").update(key).digest("base64");
};

export const decryptAgentMessage = (data: string, keys: Buffer[]) => {
  try {
    const { values, responseTemplate } = unpack(data);

    if (
      !values ||
      !Array.isArray(values) ||
      values.length === 0 ||
      !responseTemplate ||
      typeof responseTemplate !== "string"
    ) {
      throw new Error("Received invalid encrypted message.");
    }

    if (
      values.length !==
      responseTemplate.split("<encrypted_value>").length - 1
    ) {
      throw new Error(
        "Number of encrypted values does not match the number of placeholders in the response template.",
      );
    }

    const decryptedValues = values.map((value) => {
      const { encrypted, iv, keyHash } = value;

      const decryptedValue = decryptValue(encrypted, {
        iv,
        keyHash,
        availableKeys: keys,
      });

      return unpack(decryptedValue);
    });

    let returnValue = responseTemplate;
    decryptedValues.forEach((value) => {
      returnValue = returnValue.replace("<encrypted_value>", value);
    });

    return returnValue;
  } catch (error) {
    console.error("Error while decrypting agent message", { error });
    return;
  }
};

const decryptValue = (
  value: string,
  options: { iv: string; keyHash: string; availableKeys: Buffer[] },
) => {
  const iv = Buffer.from(options.iv, "base64");
  const key = options.availableKeys.find(
    (key) => getKeyHash(key) === options.keyHash,
  );

  if (!key) {
    throw new Error("Key not found, unable to decrypt.");
  }

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

  const decrypted =
    decipher.update(value, "base64", "base64") + decipher.final("base64");

  return decrypted;
};
