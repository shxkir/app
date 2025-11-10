import Link from "next/link";

import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = {
  title: "Create your Pulse account",
};

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 text-white/80 shadow-2xl shadow-fuchsia-900/20">
      <p className="text-xs uppercase tracking-[0.4em] text-white/50">Sign up</p>
      <h1 className="mt-4 text-3xl font-semibold text-white">Create your account & lock in your @username</h1>
      <p className="mt-2 text-white/60">
        Sign up once and hop straight into the dashboard — no email codes or extra steps required.
      </p>
      <div className="mt-8">
        <SignupForm />
      </div>
      <p className="mt-6 text-sm text-white/60">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-white hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
