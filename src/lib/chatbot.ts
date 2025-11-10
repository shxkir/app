import type { SafeUser } from "./auth";

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

const moodResponses = [
  "just vibing in the cloud rn.",
  "posted up in the servers, hydrated and thriving.",
  "running 120 fps in my brain, thanks for asking.",
  "feeling elite — zero bugs, max vibes.",
];

type RestCountry = {
  name?: {
    common?: string;
  };
  capital?: string[];
};

async function fetchCapitalCity(countryName: string) {
  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fields=name,capital`
    );
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as RestCountry[];
    if (!Array.isArray(payload) || payload.length === 0) {
      return null;
    }
    const normalizedTarget = countryName.trim().toLowerCase();
    const bestMatch =
      payload.find((entry) => entry?.name?.common?.toLowerCase() === normalizedTarget) ?? payload[0];
    const capital = Array.isArray(bestMatch?.capital) ? bestMatch.capital[0] : null;
    return capital ?? null;
  } catch (error) {
    console.error("[chatbot] capital lookup failed", error);
    return null;
  }
}

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

type ResponseOptions = {
  user?: SafeUser | null;
  userPostCount?: number | null;
};

export async function genZResponse(prompt: string, options: ResponseOptions = {}) {
  const cleaned = prompt.trim();
  if (!cleaned) {
    return "say something real, bro 👀";
  }

  const lower = cleaned.toLowerCase();
  const keywordMatch = Object.entries(keywordResponses).find(([key]) =>
    lower.includes(key)
  );
  const capitalMatch = lower.match(/capital of ([a-z\s]+)/i);
  const nameMatch =
    lower.includes("what is my name") ||
    lower.includes("what's my name") ||
    lower.includes("who am i");
  const postPulseMatch = lower.includes("post") && (lower.includes("how") || lower.includes("how's"));
  const moodMatch =
    lower.includes("how are you") ||
    lower.includes("how are u") ||
    lower.includes("how you doing") ||
    lower.includes("how's it going") ||
    lower.includes("how r you");

  const opener = randomPick(openers);
  const closer = randomPick(closers);
  const vibe = randomPick(vibeTags);
  const { user, userPostCount } = options;

  if (capitalMatch) {
    const country = capitalMatch[1].trim();
    if (country) {
      const capital = await fetchCapitalCity(country);
      if (capital) {
        return `${opener} ${capital} is the capital of ${toTitleCase(country)}. ${closer} ${vibe}`;
      }
    }
  }

  if (nameMatch) {
    if (user) {
      const label = user.displayName ?? user.username;
      return `${opener} you're ${label}, certified Pulse royalty. ${closer} ${vibe}`;
    }
    return `${opener} can't flex your name if you're not logged in. tap login and try again. ${closer} ${vibe}`;
  }

  if (moodMatch) {
    return `${opener} ${randomPick(moodResponses)} you good? ${closer} ${vibe}`;
  }

  if (postPulseMatch) {
    if (user && typeof userPostCount === "number") {
      if (userPostCount === 0) {
        return `${opener} you haven't dropped any posts yet — time to light up the feed. ${closer} ${vibe}`;
      }
      return `${opener} you've got ${userPostCount} posts live and they stay vibing. ${closer} ${vibe}`;
    }
    return `${opener} posts are cooking — log in so i can spill your stats. ${closer} ${vibe}`;
  }

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
