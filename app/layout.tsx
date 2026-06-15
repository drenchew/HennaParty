import type { Metadata } from "next";
import { GuestProvider } from "@/components/providers/GuestProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Henna Night",
  description: "Interactive Henna Party experience for wedding guests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <GuestProvider>{children}</GuestProvider>
      </body>
    </html>
  );
}
