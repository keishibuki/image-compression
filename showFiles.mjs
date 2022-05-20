import { readdir } from "fs/promises";
import path from "path";

const showFiles = async (dirPath, callback) => {
  try {
    const dirents = await readdir(dirPath, { withFileTypes: true });

    for (const dirent of dirents) {
      const fp = path.join(dirPath, dirent.name);

      if (dirent.isDirectory()) {
        await showFiles(fp, callback);
      } else {
        callback(fp);
      }
    }
  } catch (err) {
    console.error(err);
    return;
  }

  return "finish: 1";
};

export default showFiles;
