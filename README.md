# Transposer

Written and concert pitch for transposing instruments (clarinets, saxophones, horns, trumpets, tubas, double bass, and more).

## Modes

- **Notes**: enter written or concert pitches on a piano and see both on a grand staff.
- **Keys**: pick a key and see its equivalent for every instrument.
- **Melody**: build a line on the staff or with the piano, with durations, rests and chords. Play back the concert pitch.
- **Score**: open MusicXML (`.musicxml`, `.xml`) or compressed MXL (`.mxl`), choose each part's instrument, view written or concert, and download MusicXML.

The interface is available in English and Thai (ภาษาไทย), switched in the top-right corner.

## Run locally

```bash
npm install
npm run dev        # development server
npm test           # unit tests
npm run build      # type-check and production build into dist/
npm run preview    # serve the production build (service worker active)
```

## Offline use

The production build registers a service worker that caches every built file. After one visit online, the app opens and works without a connection. Fonts (Sarabun) are cached when first loaded.

## Deploy (GitHub Pages)

The workflow in `.github/workflows/deploy.yml` builds, tests and publishes on every push to `main`.

1. Make this folder the root of a GitHub repository, and push it.
2. In the repository, open Settings > Pages and set Source to **GitHub Actions**.
3. Push to `main`. The site appears at `https://<user>.github.io/<repo>/`.

The build uses relative paths, so it works both at a domain root and in a sub-folder.

## Data status

- Instrument transpositions and ranges are a working table. Several rows are marked "unverified" in `src/core/instruments.ts`, and written ranges are approximate. Check them against a reference (Adler, Kennan, or a brass-band chart) before relying on range warnings.
- Thai instrument names are working translations. A Thai musician should review them.
- MXL files are read with the browser's `DecompressionStream`. Browsers without it (older Safari) need `.musicxml` instead.

## Credits

Designed by Yos Vaneesorn.
