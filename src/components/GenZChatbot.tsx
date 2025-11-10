"use client";

import { FormEvent, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
};

const initialMessage: ChatMessage = {
  id: "intro",
  role: "bot",
  text: "yo, I'm Invisibility — your bro-mode chatbot. drop whatever you got 👀",
};

export function GenZChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: data.answer ?? "brain dump went brrr. try again?",
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: "wifi vibes off rn. try again in a sec!",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-fuchsia-500/20">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-emerald-300">Invisibility</p>
          <h2 className="text-2xl font-semibold text-white">Resident Gen-Z chat bro</h2>
        </div>
        <span className="rounded-full border border-emerald-400/40 px-3 py-1 text-xs text-emerald-200">
          online ✨
        </span>
      </div>
      <div className="mb-4 max-h-72 space-y-3 overflow-y-auto pr-2 text-sm">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                message.role === "user"
                  ? "bg-fuchsia-500/30 text-fuchsia-50"
                  : "bg-white/10 text-white/90"
              }`}
            >
              {message.text}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="ask about follows, vibes, or literally anything..."
          className="flex-1 rounded-2xl border border-white/20 bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSending}
          className="rounded-2xl bg-fuchsia-500/80 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/40 transition hover:bg-fuchsia-400/90 disabled:opacity-60"
        >
          {isSending ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
