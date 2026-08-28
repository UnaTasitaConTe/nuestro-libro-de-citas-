/**
 * Script para generar thumbnails de fotos existentes que no lo tienen.
 *
 * Uso: node src/scripts/generateThumbnails.js
 *
 * Procesa de a UNA foto a la vez para no saturar la memoria del servidor.
 */
require('dotenv/config');
const path = require('path');
const pool = require('../adapters/postgres/pool');
const ThumbnailService = require('../adapters/filesystem/ThumbnailService');

const rootDir = path.join(__dirname, '..', '..');
const thumbnailService = new ThumbnailService({ rootDir });

async function run() {
  console.log('Generando thumbnails para fotos existentes...\n');

  const { rows: photos } = await pool.query(
    'SELECT id, foto_url FROM entry_photos WHERE thumb_url IS NULL ORDER BY id'
  );

  if (!photos.length) {
    console.log('✅ Todas las fotos ya tienen thumbnail.');
    process.exit(0);
  }

  console.log(`Fotos sin thumbnail: ${photos.length}\n`);
  let processed = 0;
  let errors = 0;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const filename = path.basename(photo.foto_url);

    try {
      const thumbUrl = await thumbnailService.generate(filename);
      await pool.query('UPDATE entry_photos SET thumb_url = $1 WHERE id = $2', [
        thumbUrl,
        photo.id,
      ]);
      processed++;
    } catch (err) {
      console.error(`  ❌ Error foto ${photo.id} (${filename}): ${err.message}`);
      errors++;
    }

    if ((i + 1) % 10 === 0 || i === photos.length - 1) {
      console.log(`  Progreso: ${i + 1}/${photos.length} (${processed} ok, ${errors} errores)`);
    }
  }

  console.log(`\n✅ Completado: ${processed} thumbnails generados, ${errors} errores.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
