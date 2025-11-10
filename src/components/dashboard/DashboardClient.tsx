"use client";

import { useEffect, useMemo, useState } from "react";

import type { SafeUser } from "@/lib/auth";

type FollowData = {
  followers: SafeUser[];
  following: SafeUser[];
  suggestions: SafeUser[];
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isMine: boolean;
};

const emptyFollowData: FollowData = {
  followers: [],
  following: [],
  suggestions: [],
};

export function DashboardClient({ user }: { user: SafeUser }) {
  const [followData, setFollowData] = useState<FollowData>(emptyFollowData);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);

  const orbitUsers = useMemo(() => {
    const map = new Map<string, SafeUser>();
    [...followData.following, ...followData.followers].forEach((person) => {
      if (!map.has(person.id)) {
        map.set(person.id, person);
      }
    });
    return Array.from(map.values());
  }, [followData]);

  useEffect(() => {
    void loadFollowState();
  }, []);

  useEffect(() => {
    if (!selectedUserId && orbitUsers.length > 0) {
      setSelectedUserId(orbitUsers[0].id);
    }
  }, [orbitUsers, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedUserId);
  }, [selectedUserId]);

  const loadFollowState = async () => {
    setLoadingFollow(true);
    try {
      const response = await fetch("/api/follow");
      const data = await response.json();
      if (response.ok) {
        setFollowData({
          followers: data.followers ?? [],
          following: data.following ?? [],
          suggestions: data.suggestions ?? [],
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingFollow(false);
    }
  };

  const toggleFollow = async (targetId: string) => {
    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetId }),
      });
      if (response.ok) {
        await loadFollowState();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadMessages = async (peerId: string) => {
    setLoadingConversation(true);
    try {
      const response = await fetch(`/api/messages?with=${peerId}`);
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages ?? []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingConversation(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedUserId || !messageInput.trim()) {
      return;
    }

    const content = messageInput.trim();
    setMessageInput("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: selectedUserId, content }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        console.error(data.error ?? "Unable to send message");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-fuchsia-950/20">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Dashboard</p>
          <h1 className="text-3xl font-semibold text-white">
            Hey {user.displayName ?? user.username}, grow your orbit.
          </h1>
          <p className="text-white/70">
            Follow people to unlock DMs. Anyone you follow or who follows you shows up in the inbox on the right.
          </p>
        </div>
        <dl className="mt-6 grid grid-cols-3 gap-4 text-center text-sm text-white/60">
          <div className="rounded-2xl border border-white/10 p-4">
            <dt className="uppercase tracking-widest text-xs">Following</dt>
            <dd className="text-2xl font-semibold text-white">{followData.following.length}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <dt className="uppercase tracking-widest text-xs">Followers</dt>
            <dd className="text-2xl font-semibold text-white">{followData.followers.length}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <dt className="uppercase tracking-widest text-xs">DM access</dt>
            <dd className="text-lg font-semibold text-emerald-300">
              {orbitUsers.length ? "unlocked" : "follow first"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">People you may know</h2>
            {loadingFollow && <span className="text-xs text-white/50">refreshing...</span>}
          </div>
          <div className="mt-4 space-y-4 text-sm text-white/70">
            {followData.suggestions.length === 0 && <p>No suggestions yet. Invite friends!</p>}
            {followData.suggestions.map((person) => (
              <div key={person.id} className="flex items-center justify-between rounded-2xl border border-white/5 p-4">
                <div>
                  <p className="text-white font-medium">@{person.username}</p>
                  {person.bio && <p className="text-xs text-white/60">{person.bio}</p>}
                </div>
                <button
                  onClick={() => void toggleFollow(person.id)}
                  className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-widest text-white transition hover:bg-white/10"
                >
                  follow
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
          <h2 className="text-lg font-semibold text-white">Followers</h2>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            {followData.followers.length === 0 && <p>No one yet. Share your profile!</p>}
            {followData.followers.map((person) => (
              <div key={person.id} className="flex items-center justify-between rounded-2xl border border-white/5 p-4">
                <div>
                  <p className="text-white font-medium">@{person.username}</p>
                  {person.bio && <p className="text-xs text-white/60">{person.bio}</p>}
                </div>
                <button
                  onClick={() => void toggleFollow(person.id)}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-white hover:bg-white/10"
                >
                  {followData.following.some((f) => f.id === person.id) ? "following" : "follow back"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-indigo-900/20">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Direct messages</p>
          <h2 className="text-2xl font-semibold text-white">Keep it friendly.</h2>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[240px,1fr]">
          <aside className="space-y-3">
            {orbitUsers.length === 0 && (
              <p className="rounded-2xl border border-white/10 p-4 text-sm text-white/70">
                Follow someone to open their DMs.
              </p>
            )}
            {orbitUsers.map((person) => (
              <button
                key={person.id}
                onClick={() => setSelectedUserId(person.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  selectedUserId === person.id
                    ? "border-fuchsia-400/50 bg-fuchsia-500/10 text-white"
                    : "border-white/10 bg-slate-950/40 text-white/70 hover:border-white/40"
                }`}
              >
                @{person.username}
              </button>
            ))}
          </aside>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
            {!selectedUserId && (
              <p className="text-sm text-white/60">Pick someone from the left to start messaging.</p>
            )}
            {selectedUserId && (
              <>
                <div className="mb-4 flex items-center justify-between text-sm text-white/60">
                  <p>Chat with @{orbitUsers.find((u) => u.id === selectedUserId)?.username}</p>
                  {loadingConversation && <span>loading…</span>}
                </div>
                <div className="max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-white/10 p-4">
                  {messages.length === 0 && (
                    <p className="text-sm text-white/60">No messages yet. Say hi!</p>
                  )}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isMine ? "justify-end" : "justify-start"}`}
                    >
                      <p
                        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                          message.isMine
                            ? "bg-fuchsia-500/20 text-fuchsia-100"
                            : "bg-white/10 text-white/90"
                        }`}
                      >
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <input
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm text-white"
                  />
                  <button
                    onClick={() => void sendMessage()}
                    className="rounded-2xl bg-fuchsia-500/80 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-500"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
