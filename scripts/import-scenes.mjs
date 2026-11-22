// Reads edited Markdown from docs/scenes/ back into the JSON content files.
// Prints every changed line, per scene, and writes only with --apply.
// Refuses any change to a scene marked "locked", and writes nothing if anything is refused.
// Changing a draft's status line to "locked" is allowed and carries into the JSON.
// Run: npm run import-scenes           (report only)
//      npm run import-scenes -- --apply
import { importBook } from './scenebook/book.mjs';

const { refused } = importBook({ apply: process.argv.includes('--apply') });
if (refused.length) process.exit(1);
