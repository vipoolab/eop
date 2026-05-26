import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai, Sarabun } from "next/font/google";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/theme-provider";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Sarabun — closest Google Fonts equivalent to TH Sarabun PSK
// (the official font per ระเบียบสารบรรณ ที่ นร ๐๑๐๖/ว ๒๐๑๗ ลว. ๑๒ ม.ค. ๖๔)
// Used for formal government letter rendering (preview + print).
const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EOP — สำนักงานยุทธศาสตร์ตำรวจ",
  description:
    "Enterprise Operation Planning — ระบบวางแผนและติดตามการปฏิบัติงานสำนักงานตำรวจแห่งชาติ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EOP",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e3a5f" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${notoThai.variable} ${sarabun.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          // Set theme class before React hydrates to avoid flash
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full bg-slate-50 text-slate-900 font-[var(--font-thai)] transition-colors">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
