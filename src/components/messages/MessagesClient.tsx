"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Avatar } from "@/components/Avatar";

type ConversationSummary = {
  id: string;
  peer: {
    id: string;
    username: string;
    displayName: string | null;
    profileImage: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isMine: boolean;
  };
};

type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isMine: boolean;
  senderProfileImage: string | null;
  senderDisplayName: string | null;
  senderUsername: string;
};

type MessagesClientProps = {
  initialConversations: ConversationSummary[];
};

export function MessagesClient({ initialConversations }: MessagesClientProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>(initialConversations);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(
    initialConversations[0]?.peer.id ?? null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPeerId && conversations.length > 0) {
      setSelectedPeerId(conversations[0].peer.id);
    } else if (selectedPeerId && !conversations.some((conversation) => conversation.peer.id === selectedPeerId)) {
      setSelectedPeerId(conversations[0]?.peer.id ?? null);
    }
  }, [conversations, selectedPeerId]);

  const refreshConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/messages/conversations");
      const data = await response.json();
      if (response.ok) {
        setConversations(data.conversations ?? []);
      }
    } catch (refreshError) {
      console.error(refreshError);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      void refreshConversations();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshConversations]);

  const loadMessages = useCallback(
    async (peerId: string, options?: { silent?: boolean }) => {
      if (!peerId) {
        return;
      }
      if (!options?.silent) {
        setLoadingMessages(true);
        setError(null);
      }
      try {
        const response = await fetch(`/api/messages?with=${peerId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Unable to load messages.");
        }
        setMessages(data.messages ?? []);
      } catch (loadError) {
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : "Unable to load messages.");
      } finally {
        if (!options?.silent) {
          setLoadingMessages(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedPeerId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedPeerId);
  }, [selectedPeerId, loadMessages]);

  useEffect(() => {
    if (!selectedPeerId) {
      return;
    }
    const interval = setInterval(() => {
      void loadMessages(selectedPeerId, { silent: true });
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedPeerId, loadMessages]);

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPeerId || !messageInput.trim()) {
      return;
    }
    const content = messageInput.trim();
    setMessageInput("");
    setSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: selectedPeerId, content }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Unable to send message.");
      }
      setMessages((prev) => [...prev, data.message]);
      setConversations((prev) => {
        const target = prev.find((conversation) => conversation.peer.id === selectedPeerId);
        if (!target) {
          return prev;
        }
        const remaining = prev.filter((conversation) => conversation.peer.id !== selectedPeerId);
        const updatedSummary: ConversationSummary = {
          ...target,
          lastMessage: data.message,
        };
        return [updatedSummary, ...remaining];
      });
    } catch (sendError) {
      console.error(sendError);
      setError(sendError instanceof Error ? sendError.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.peer.id === selectedPeerId) ?? null,
    [conversations, selectedPeerId]
  );

  const formatTimestamp = (value: string) => {
    const date = new Date(value);
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl shadow-black/30 lg:grid-cols-[280px_1fr]">
      <div className="space-y-4 border-b border-white/10 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Conversations</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-white/40">
            {conversations.length} chats
          </span>
        </div>
        <div className="space-y-2 overflow-y-auto pr-2" style={{ maxHeight: "60vh" }}>
          {conversations.length === 0 && (
            <p className="rounded-2xl border border-white/10 p-4 text-sm text-white/70">
              No DMs yet. Start chatting from profiles or the feed.
            </p>
          )}
          {conversations.map((conversation) => {
            const isActive = conversation.peer.id === selectedPeerId;
            return (
              <button
                key={conversation.peer.id}
                onClick={() => setSelectedPeerId(conversation.peer.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-white/40 bg-white/10"
                    : "border-white/5 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={conversation.peer.profileImage}
                    alt={`${conversation.peer.username}'s avatar`}
                    fallbackLabel={conversation.peer.displayName ?? conversation.peer.username}
                    size="md"
                    className="shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-white">
                      {conversation.peer.displayName ?? `@${conversation.peer.username}`}
                    </p>
                    <p className="text-xs text-white/50">
                      {conversation.lastMessage.content.slice(0, 40)}
                      {conversation.lastMessage.content.length > 40 ? "…" : ""}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex h-[70vh] flex-col rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        {selectedConversation ? (
          <>
            <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-4">
                <Avatar
                  src={selectedConversation.peer.profileImage}
                  alt={`${selectedConversation.peer.username}'s avatar`}
                  fallbackLabel={selectedConversation.peer.displayName ?? selectedConversation.peer.username}
                  size="lg"
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.4em] text-white/50">Chatting with</p>
                  <h3 className="text-xl font-semibold text-white">
                    {selectedConversation.peer.displayName ?? `@${selectedConversation.peer.username}`}
                  </h3>
                  <p className="text-xs text-white/40">@{selectedConversation.peer.username}</p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-300/40 px-3 py-1 text-xs text-emerald-200">
                Live
              </span>
            </header>
            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-2">
              {loadingMessages && (
                <p className="text-xs text-white/50">Loading conversation...</p>
              )}
              {messages.map((message) => {
                const fallback = message.senderDisplayName ?? `@${message.senderUsername}`;
                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-3 ${message.isMine ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar
                      src={message.senderProfileImage}
                      alt={`${fallback}'s avatar`}
                      fallbackLabel={fallback}
                      size="md"
                      className="shrink-0"
                    />
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                        message.isMine
                          ? "bg-fuchsia-600/40 text-white text-right"
                          : "bg-white/10 text-white/90"
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-widest text-white/50">
                        {formatTimestamp(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && !loadingMessages && (
                <p className="rounded-2xl border border-white/10 p-4 text-center text-sm text-white/70">
                  No messages yet. Say hi to kick things off.
                </p>
              )}
            </div>
            {error && <p className="text-xs text-rose-300">{error}</p>}
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-3">
              <textarea
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                placeholder="Message..."
                className="min-h-[48px] flex-1 rounded-2xl border border-white/20 bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !messageInput.trim()}
                className="rounded-2xl bg-fuchsia-500/80 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/40 transition hover:bg-fuchsia-400/90 disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center text-white/70">
            <p className="text-lg font-semibold">No conversations yet</p>
            <p className="mt-2 max-w-sm text-sm">
              Follow someone and send a message from their profile to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
