/** "Bb3" -> "B♭3", "F#4" -> "F♯4". Leaves natural pitches alone. */
export function formatPitch(pitch: string): string {
  return pitch.replace(/^([A-G])(#+|b+)(-?\d+)$/, (_m, letter: string, acc: string, octave: string) => {
    const marks = acc.startsWith('#') ? '♯'.repeat(acc.length) : '♭'.repeat(acc.length);
    return `${letter}${marks}${octave}`;
  });
}
