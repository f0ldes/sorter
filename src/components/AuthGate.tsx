"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { LogIn, LogOut } from "lucide-react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Personal Sorting Library</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Sign in to start cataloging your stuff.
          </p>
        </div>
        <button
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          <LogIn size={16} />
          Sign in with Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut(auth)}
      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
    >
      <LogOut size={14} />
      Sign out
    </button>
  );
}
