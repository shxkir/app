import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Log in to Pulse",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-10 text-white/80 shadow-2xl shadow-emerald-900/20">
      <p className="text-xs uppercase tracking-[0.4em] text-white/50">Log in</p>
      <h1 className="mt-4 text-3xl font-semibold text-white">Welcome back</h1>
      <p className="mt-2 text-white/60">
        Use your email + password. Need an account?{" "}
        <Link href="/auth/signup" className="text-white hover:underline">
          Sign up here.
        </Link>
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
