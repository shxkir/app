const openers = ["yo", "bro listen", "ngl", "lowkey", "highkey", "bro fr"];

const vibeTags = ["✨", "💅", "🥤", "🔥", "🫶", "🌈", "🤸‍♀️", "💻"];

const closers = [
  "that's the move fr.",
  "hope that clears it up bro.",
  "go lock it in.",
  "stay locked and dialed.",
  "alright i'm out.",
];

const keywordResponses: Record<string, string> = {
  hello: "yo what's good?",
  hi: "sup bro, what's the angle?",
  hey: "hey bro, what's the play?",
  help: "say less, i'm on it.",
  follow: "go hype your crew, that's literally the point.",
  message: "slide into the DMs respectfully, bro.",
  admin: "admin mode is straight boss energy.",
  verified: "verification is instant now bro, you're good.",
  bot: "i'm basically your Gen-Z bro AI.",
};

const randomPick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export function genZResponse(prompt: string) {
  const cleaned = prompt.trim();
  if (!cleaned) {
    return "say something real, bro 👀";
  }

  const lower = cleaned.toLowerCase();
  const keywordMatch = Object.entries(keywordResponses).find(([key]) =>
    lower.includes(key)
  );

  const opener = randomPick(openers);
  const closer = randomPick(closers);
  const vibe = randomPick(vibeTags);

  if (keywordMatch) {
    return `${opener} ${keywordMatch[1]} ${closer} ${vibe}`;
  }

  if (lower.includes("?")) {
    return `${opener} solid question — i'd ${cleaned.replace("?", "")}? lock it in and keep moving. ${closer} ${vibe}`;
  }

  if (lower.length < 6) {
    return `${opener} need more details bro ${vibe}`;
  }

  return `${opener} ${cleaned} is valid. stay focused & keep the drama lowkey. ${closer} ${vibe}`;
}
