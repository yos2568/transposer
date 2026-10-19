/** Notation colours for the dark theme: light ink, dim staff lines, brass for written pitch, teal for concert. */
export const INK = '#eaeff7';
export const LINES = '#3a4660';
export const REST = '#6a7894';
export const TONE_COLOR = { written: '#f0b45a', concert: '#5ed6c5' } as const;
export type Tone = keyof typeof TONE_COLOR;
