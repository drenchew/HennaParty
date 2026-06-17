import type { Metadata } from "next";
import { BackgroundLayout } from "@/components/layout/BackgroundLayout";
import { FlowProvider } from "@/components/providers/FlowProvider";
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
      <body className="flow-body">
        <FlowProvider>
          <BackgroundLayout>
            <div className="flow-app experience-app">{children}</div>
          </BackgroundLayout>
        </FlowProvider>
      </body>
    </html>
  );
}
