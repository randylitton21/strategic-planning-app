import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import LayoutChrome from "./LayoutChrome";

export const metadata: Metadata = {
  title: "Strategic Planning Suite",
  description:
    "A practical toolkit for strategic planning, execution, and personal finance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <LayoutChrome>{children}</LayoutChrome>
        </Providers>
      </body>
    </html>
  );
}
