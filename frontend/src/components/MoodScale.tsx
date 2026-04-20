import { cn } from "../lib/utils";

const MOOD_EMOJI: Record<number, string> = {
  1: "\u{1F622}",  // crying face
  2: "\u{1F61E}",  // disappointed
  3: "\u{1F641}",  // slightly frowning
  4: "\u{1F615}",  // confused
  5: "\u{1F610}",  // neutral
  6: "\u{1F642}",  // slightly smiling
  7: "\u{1F60A}",  // smiling with eyes
  8: "\u{1F604}",  // grinning
  9: "\u{1F601}",  // beaming
  10: "\u{1F929}", // star-struck
};

interface MoodScaleProps {
  value: number | null;
  onChange: (value: number) => void;
}

export default function MoodScale({ value, onChange }: MoodScaleProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all hover:scale-105",
            value === n
              ? "border-primary bg-primary/10 scale-105"
              : "border-border hover:border-primary/50"
          )}
        >
          <span className="text-2xl">{MOOD_EMOJI[n]}</span>
          <span className="text-xs font-medium">{n}</span>
        </button>
      ))}
    </div>
  );
}
