const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const THUMB_WIDTH = 400;
const THUMB_QUALITY = 70;
const THUMB_DIR = 'thumbs';

class ThumbnailService {
  constructor({ rootDir }) {
    this.rootDir = rootDir;
    this.thumbDir = path.join(rootDir, 'uploads', THUMB_DIR);
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(this.thumbDir)) {
      fs.mkdirSync(this.thumbDir, { recursive: true });
    }
  }

  /**
   * Genera un thumbnail webp para una imagen subida.
   * @param {string} filename - nombre del archivo original (ej: abc123.jpg)
   * @returns {Promise<string>} ruta relativa del thumbnail (ej: /uploads/thumbs/abc123.webp)
   */
  async generate(filename) {
    const inputPath = path.join(this.rootDir, 'uploads', filename);
    const thumbFilename = path.parse(filename).name + '.webp';
    const outputPath = path.join(this.thumbDir, thumbFilename);

    try {
      await sharp(inputPath)
        .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY })
        .toFile(outputPath);

      return `/uploads/${THUMB_DIR}/${thumbFilename}`;
    } catch (err) {
      // Si falla la generación del thumb, devolvemos la URL original
      console.error(`[ThumbnailService] Error generando thumb para ${filename}:`, err.message);
      return `/uploads/${filename}`;
    }
  }

  /**
   * Elimina el thumbnail asociado a un archivo.
   * @param {string} thumbUrl - ruta del thumbnail (ej: /uploads/thumbs/abc123.webp)
   */
  remove(thumbUrl) {
    if (!thumbUrl || !thumbUrl.includes(`/${THUMB_DIR}/`)) return;
    const fullPath = path.join(this.rootDir, thumbUrl);
    fs.unlink(fullPath, () => {});
  }
}

module.exports = ThumbnailService;
