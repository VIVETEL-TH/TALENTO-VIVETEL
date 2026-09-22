import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talento Vivetel",
  description: "Talento Humano y SST — Vivetel Telecomunicaciones",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
