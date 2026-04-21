import { cn } from "@/lib/utils";

const MOOD_EMOJI: Record<number, string> = {
  1: "\u{1F622}",
  2: "\u{1F61E}",
  3: "\u{1F641}",
  4: "\u{1F615}",
  5: "\u{1F610}",
  6: "\u{1F642}",
  7: "\u{1F60A}",
  8: "\u{1F604}",
  9: "\u{1F601}",
  10: "\u{1F929}",
};

interface MoodScaleProps {
  value: number | null;
  onChange: (value: number) => void;
}

export default function MoodScale({ value, onChange }: MoodScaleProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 lg:gap-3">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-default hover:scale-105 active:scale-95 lg:p-4",
            value === n
              ? "border-brand-teal bg-brand-teal/10 scale-105 shadow-md"
              : "border-border hover:border-brand-teal/50 hover:shadow-sm"
          )}
        >
          <span className="text-2xl lg:text-3xl">{MOOD_EMOJI[n]}</span>
          <span className="text-xs font-semibold lg:text-sm">{n}</span>
        </button>
      ))}
    </div>
  );
}
