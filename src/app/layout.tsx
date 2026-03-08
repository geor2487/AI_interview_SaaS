import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const mPlusRounded = M_PLUS_Rounded_1c({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "InterviewAI",
  description: "AI面接支援SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={mPlusRounded.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
