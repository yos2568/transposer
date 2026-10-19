import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * After the build, fill in the service worker: the list of every built file and a
 * cache version derived from those files, so an updated build gets a fresh cache.
 */
function offlinePrecache(): Plugin {
  return {
    name: 'offline-precache',
    apply: 'build',
    closeBundle() {
      const dist = resolve('dist');
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          // Skip macOS metadata sidecars (._*) and .DS_Store; they are not app files.
          if (name.startsWith('._') || name === '.DS_Store') continue;
          const full = join(dir, name);
          if (statSync(full).isDirectory()) walk(full);
          else files.push(relative(dist, full).split('\\').join('/'));
        }
      };
      walk(dist);

      const urls = files.filter((f) => f !== 'sw.js').sort();
      const version = createHash('sha256')
        .update(urls.map((u) => `${u}:${statSync(join(dist, u)).size}`).join('|'))
        .digest('hex')
        .slice(0, 12);

      const swPath = join(dist, 'sw.js');
      const source = readFileSync(swPath, 'utf8');
      writeFileSync(
        swPath,
        source
          .replaceAll('__CACHE_VERSION__', version)
          .replaceAll('__PRECACHE_URLS__', JSON.stringify(['./', ...urls])),
      );
    },
  };
}

export default defineConfig({
  // Relative asset paths: the same build works at the domain root or in a sub-folder (GitHub Pages).
  base: './',
  plugins: [react(), offlinePrecache()],
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/._*'],
  },
});
