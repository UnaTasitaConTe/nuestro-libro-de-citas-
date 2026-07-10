const fs = require('fs');
const path = require('path');

class LocalFileStorageAdapter {
  constructor({ rootDir }) {
    this.rootDir = rootDir;
  }

  buildUrl(filename) {
    return `/uploads/${filename}`;
  }

  removeFiles(files) {
    (files || []).forEach((f) => fs.unlink(f.path, () => {}));
  }

  removeStoredFile(fileUrl) {
    if (!fileUrl) return;
    const fullPath = path.join(this.rootDir, fileUrl);
    fs.unlink(fullPath, () => {});
  }
}

module.exports = LocalFileStorageAdapter;
