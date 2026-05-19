import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { AuthSessionProvider } from "@/components/session-provider";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EOP — สำนักงานยุทธศาสตร์ตำรวจ",
  description:
    "Enterprise Operation Planning — ระบบวางแผนและติดตามการปฏิบัติงานสำนักงานตำรวจแห่งชาติ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${notoThai.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900 font-[var(--font-thai)]">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
