// a simple kv store that stores data in tmpdir

import fs from "fs";
import path from "path";
import { promisify } from "util";
import os from "os";

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

async function set(key: string, value: string) {
  const tmpdir = os.tmpdir();
  const filePath = path.join(tmpdir, key);
  await writeFile(filePath, value);
}

async function get(key: string): Promise<string | null> {
  const tmpdir = os.tmpdir();
  const filePath = path.join(tmpdir, key);
  try {
    return await readFile(filePath, "utf8");
  } catch (e) {
    return null;
  }
}

export const temporaryKV = {
  set,
  get,
};
