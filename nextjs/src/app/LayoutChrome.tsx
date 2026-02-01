"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isToolRoute(pathname: string | null) {
  if (!pathname || pathname === "/app" || pathname === "/app/login")
    return false;
  return pathname.startsWith("/app/");
}

export default function LayoutChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const inTool = isToolRoute(pathname);

  return (
    <>
      {!inTool && (
        <header className="siteHeader">
          <div className="container siteHeaderInner">
            <div className="brand">
              <Link href="/" className="brandLink">
                Strategic Planning Suite
              </Link>
            </div>

            <nav className="nav">
              <Link href="/pricing" className="navLink">
                Pricing
              </Link>
              <Link href="/about" className="navLink">
                About
              </Link>
              <Link href="/contact" className="navLink">
                Contact
              </Link>
              <Link href="/app" className="navCta">
                Open the App
              </Link>
            </nav>
          </div>
        </header>
      )}

      <main className={inTool ? "main main--tool" : "main"}>{children}</main>

      <footer className="siteFooter">
        <div className="container siteFooterInner">
          {inTool ? (
            <span className="muted">Beta</span>
          ) : (
            <>
              <span>Strategic Planning Suite</span>
              <span className="muted">Beta</span>
            </>
          )}
        </div>
      </footer>
    </>
  );
}
