// The first standard: "What's one line you won't cross anymore?"
// The game won't accept a line that can't be kept or broken. It never scores the line.
//
// JIM: this check is Claude's simplest guess at "can be kept or broken". It looks for
// two kinds of line the Scene Book names:
//   vague  ("Do better."): too short, or built on comparison words with nothing concrete.
//   total  ("Never touch my phone again."): sweeping words that make a whole new life.
// Anything else is accepted. Tune the word lists here.

export type StandardCheck = 'ok' | 'vague' | 'total' | 'empty';

const TOTAL = /\b(never\b.*\bagain|always|forever|every\s+(single\s+)?(day|time|morning|night)|everything|all the time|from now on|for good)\b/i;
const VAGUE = /\b(better|harder|more|less|healthier|happier|best|try to|try and|get it together|life together|improve|work on)\b/i;

export function checkStandard(raw: string): StandardCheck {
  const text = raw.trim();
  if (!text) return 'empty';
  if (TOTAL.test(text)) return 'total';
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 3) return 'vague';
  if (VAGUE.test(text) && !/\d/.test(text)) return 'vague';
  return 'ok';
}
