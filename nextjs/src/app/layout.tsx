import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import LayoutChrome from "./LayoutChrome";

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
          <LayoutChrome>{children}</LayoutChrome>
        </Providers>
      </body>
    </html>
  );
}
