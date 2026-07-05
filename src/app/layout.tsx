import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vsoft – Raumaufmaß & Fliesenplanung",
  description:
    "Aufmaß, 2D/3D-Raumplanung, Fliesenkatalog mit Verlegemustern und Angebotsexport für Fliesenleger-Betriebe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
