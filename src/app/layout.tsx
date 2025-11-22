import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediChat AI",
  description: "Your Personal Health Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}