import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Strategic Planning Suite",
  description:
    "A practical toolkit for strategic planning, execution, and personal finance.",
};

function getFirebaseConfigScript() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    return null;
  }
  const config = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
  return `window.__FIREBASE_CONFIG__=${JSON.stringify(config)};`;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const firebaseScript = getFirebaseConfigScript();
  return (
    <html lang="en">
      <head>
        {firebaseScript ? (
          <script
            dangerouslySetInnerHTML={{ __html: firebaseScript }}
          />
        ) : null}
      </head>
      <body>
        <Providers>
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

          <main className="main">{children}</main>

          <footer className="siteFooter">
            <div className="container siteFooterInner">
              <span>Strategic Planning Suite</span>
              <span className="muted">Beta</span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
