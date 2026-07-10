class FakeFileStoragePort {
  constructor() {
    this.removedFiles = [];
    this.removedStoredFiles = [];
  }

  buildUrl(filename) {
    return `/uploads/${filename}`;
  }

  removeFiles(files) {
    this.removedFiles.push(...(files || []));
  }

  removeStoredFile(fileUrl) {
    if (!fileUrl) return;
    this.removedStoredFiles.push(fileUrl);
  }
}

module.exports = FakeFileStoragePort;
