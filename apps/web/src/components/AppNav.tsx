"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { setToken } from "@/lib/api";

export function SiteNav({ authed = false }: { authed?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="container">
      <nav className="nav">
        <Link href="/" className="brand">
          Attune
        </Link>
        <div className="nav-links">
          {authed ? (
            <>
              <Link className={pathname?.startsWith("/discover") ? "active" : ""} href="/discover">
                Discover
              </Link>
              <Link className={pathname?.startsWith("/matches") ? "active" : ""} href="/matches">
                Matches
              </Link>
              <Link className={pathname?.startsWith("/onboarding") ? "active" : ""} href="/onboarding">
                Needs
              </Link>
              <button
                className="btn ghost"
                type="button"
                onClick={() => {
                  setToken(null);
                  router.push("/login");
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link className="btn" href="/register">
                Join
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
