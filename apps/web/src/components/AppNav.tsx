"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { setToken } from "@/lib/api";

export function SiteNav({ authed = false }: { authed?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="site-header">
      <div className="container">
        <nav className="nav">
          <Link href={authed ? "/discover" : "/"} className="brand">
            Attune
          </Link>
          <div className="nav-links">
            {authed ? (
              <>
                <Link className={pathname?.startsWith("/discover") ? "active" : ""} href="/discover">
                  Discover
                </Link>
                <Link className={pathname?.startsWith("/likes") ? "active" : ""} href="/likes">
                  Likes
                </Link>
                <Link className={pathname?.startsWith("/matches") ? "active" : ""} href="/matches">
                  Matches
                </Link>
                <Link className={pathname?.startsWith("/plus") ? "active" : ""} href="/plus">
                  Plus
                </Link>
                <Link
                  className={pathname?.startsWith("/onboarding") ? "active" : ""}
                  href="/onboarding"
                >
                  Needs
                </Link>
                <Link
                  className={pathname?.startsWith("/settings") ? "active" : ""}
                  href="/settings"
                >
                  Settings
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
      </div>
    </header>
  );
}
