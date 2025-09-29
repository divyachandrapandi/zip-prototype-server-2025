import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "..", "data");

/**
 * Get full path to a JSON file from a base name (without .json)
 */
export const getFilePath = (fileName) => {
  return path.join(DATA_DIR, `${fileName}.json`);
};

/**
 * Read and parse JSON data
 */
export const getData = (fileName) => {
  const filePath = getFilePath(fileName);

  if (!fs.existsSync(filePath)) {
    return []; // return empty array if file doesn't exist
  }

  const raw = fs.readFileSync(filePath, "utf8");
  return raw ? JSON.parse(raw) : [];
};

/**
 * Write JSON data
 */
export const setData = (fileName, data) => {
  const filePath = getFilePath(fileName);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
};
