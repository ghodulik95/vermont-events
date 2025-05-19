// scripts/bump-version.js

// Files in project have ?v=N get parameter incremented, in order to
// trigger cache purge for users. This should be ran and included in a
// separate commit with every version drop.
import { promises as fs } from 'fs';
import path from 'path';

const publicDir = 'public';
// only scan these file types for bumping
const scanExts = new Set(['.html', '.js']);

async function bumpFile(filePath) {
  let content = await fs.readFile(filePath, 'utf-8');

  // 1) increment all existing ?v=N → ?v=N+1
  let updated = content.replace(
    /(\?v=)(\d+)/g,
    (_, pfx, num) => pfx + (parseInt(num, 10) + 1)
  );

  // 2) append ?v=1 to any local URL ending in .js/.css/.json/.html that lacks ?v=
  //    - matches URLs starting with ./, ../, /, or plain relative (no protocol)
  //    - negative lookahead ensures we skip http://, https://, //, or www.
  const localUrlPattern =
    /(["'(])((?:(?:\.\.\/)|(?:\.\/)|\/|)(?!https?:\/\/|\/\/|www\.)[^\s"'()<>]+\.(?:js|css|json|html))(?!\?v)(?=["'\s)<>])/g;
  updated = updated.replace(
    localUrlPattern,
    (_, lead, url) => `${lead}${url}?v=1`
  );

  if (updated !== content) {
    await fs.writeFile(filePath, updated, 'utf-8');
    console.log(
      `→ bumped versions in ${path.relative(process.cwd(), filePath)}`
    );
  }
}

async function walk(dir) {
  for (let entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
    } else if (scanExts.has(path.extname(entry.name))) {
      await bumpFile(full);
    }
  }
}

walk(publicDir).catch((err) => {
  console.error(err);
  process.exit(1);
});
