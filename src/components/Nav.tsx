"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { SignOutButton } from "./AuthGate";
import { Library, MapPin, Boxes, Plus } from "lucide-react";

export function Nav() {
  const [user] = useAuthState(auth);
  const pathname = usePathname();

  if (!user) return null;

  const link = (href: string, label: string, Icon: typeof Library) => {
    const active =
      href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm ${
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
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-4 py-2 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="flex items-center gap-1">
        {link("/", "Library", Library)}
        {link("/locations", "Locations", MapPin)}
        {link("/storages", "Storages", Boxes)}
        <Link
          href="/new"
          className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-black px-2.5 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          <Plus size={15} />
          New
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-zinc-500 sm:inline">
          {user.email}
        </span>
        <SignOutButton />
      </div>
    </nav>
  );
}
