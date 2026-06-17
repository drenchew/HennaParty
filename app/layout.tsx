import type { Metadata } from "next";
import { BackgroundLayout } from "@/components/layout/BackgroundLayout";
import { FlowProvider } from "@/components/providers/FlowProvider";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { fontVariables } from "@/lib/fonts";
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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${fontVariables} flow-body`}>
        <LocaleProvider>
          <FlowProvider>
            <BackgroundLayout>
              <div className="flow-app experience-app">{children}</div>
            </BackgroundLayout>
          </FlowProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
