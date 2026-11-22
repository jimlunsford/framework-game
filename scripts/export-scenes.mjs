// Writes every scene and encounter to Markdown in the Scene Book's reading format:
//   docs/scenes/<id>.md and docs/scenes/encounter-<id>.md, one per scene or encounter,
//   docs/scene-book-drafts.md, all of them in review order, for reading or Google Drive.
// A file with edits that haven't been imported yet is left alone. --force overwrites it.
// Run: npm run export-scenes [-- --force]
import { exportBook } from './scenebook/book.mjs';

exportBook({ force: process.argv.includes('--force') });
