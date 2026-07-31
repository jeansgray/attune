import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attune — Dating for neurodivergent connection",
  description:
    "Match on social wants, sensory needs, and communication — not neurotypical scripts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
