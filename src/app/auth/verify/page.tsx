export const metadata = {
  title: "Verification not required",
};

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-10 text-white/80 shadow-2xl shadow-indigo-900/20">
      <p className="text-xs uppercase tracking-[0.4em] text-white/50">Verify</p>
      <h1 className="mt-4 text-3xl font-semibold text-white">No email codes needed anymore</h1>
      <p className="mt-4 text-white/70">
        Pulse now lets every new member log in immediately after signing up. Head back to the{" "}
        <a href="/auth/login" className="text-white underline">
          login page
        </a>{" "}
        and jump in.
      </p>
    </div>
  );
}
