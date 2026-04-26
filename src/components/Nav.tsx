"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Library, MapPin, Boxes, Plus, LogOut } from "lucide-react";

export function Nav() {
  const [user] = useAuthState(auth);
  const pathname = usePathname();

  if (!user) return null;

  const isActive = (matchers: string[]) =>
    matchers.some((m) =>
      m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(m + "/"),
    );

  const link = (
    href: string,
    label: string,
    Icon: typeof Library,
    matchers: string[] = [href],
  ) => {
    const active = isActive(matchers);
    return (
      <Link
        href={href}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm ${
          active
            ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        }`}
      >
        <Icon size={15} />
        {label}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-10 flex items-center gap-2 border-b border-zinc-200 bg-white/80 px-2 py-2 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="flex flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {link("/", "Library", Library, ["/", "/item"])}
        {link("/locations", "Locations", MapPin, ["/locations", "/location"])}
        {link("/storages", "Storages", Boxes, ["/storages", "/storage"])}
        <Link
          href="/new"
          className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-md bg-black px-2.5 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          <Plus size={15} />
          New
        </Link>
      </div>
      <button
        onClick={() => signOut(auth)}
        title={user.email ?? "Sign out"}
        aria-label="Sign out"
        className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
      >
        <LogOut size={15} />
      </button>
    </nav>
  );
}
