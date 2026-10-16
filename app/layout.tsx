import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import { Newsreader } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import { themeInitScript } from "@/components/ThemeToggle";
import "./globals.css";

// Satoshi, the studio's main type family, used for UI copy (mapped to
// font-sans in app/theme.css). Newsreader is the serif for the hero
// captions (font-serif).
const satoshi = localFont({
  src: [
    { path: "../public/fonts/Satoshi-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://artistandmachine.com"),
  title: "Studio A&M — Artist & Machine™",
  description:
    "Artist & Machine is a freelance design company based in Beaverton, OR. Equal parts creative and technical, working closely with clients to build well-designed products.",
  keywords: [
    "Studio A&M",
    "Artist and Machine",
    "Design Studio",
    "Product Design",
    "Brand & Identity",
    "Exhibition Design",
    "Visual Merchandising",
    "Beaverton OR",
  ],
  authors: [{ name: "Bion Porzio" }],
  creator: "Bion Porzio",
  openGraph: {
    title: "Studio A&M — Artist & Machine™",
    description:
      "Artist & Machine is a freelance design company based in Beaverton, OR. Equal parts creative and technical, working closely with clients to build well-designed products.",
    url: "https://artistandmachine.com",
    siteName: "Studio A&M",
    images: [
      {
        url: "/images/hero/hero-1.webp",
        width: 1200,
        height: 630,
        alt: "Studio A&M — Artist & Machine",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio A&M — Artist & Machine™",
    description:
      "Artist & Machine is a freelance design company based in Beaverton, OR. Equal parts creative and technical, working closely with clients to build well-designed products.",
    images: ["/images/hero/hero-1.webp"],
  },
  icons: {
    icon: "/icons/favicon.svg",
    shortcut: "/icons/favicon.svg",
    apple: "/icons/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Light by default; themeInitScript adds data-theme="dark" before paint
    // for visitors who picked dark, so the attribute can differ from the
    // server HTML on purpose (hence suppressHydrationWarning, scoped to
    // this element's attributes only).
    <html lang="en" className={`${satoshi.variable} ${newsreader.variable}`} suppressHydrationWarning>
      <body>
        {/* Applies a stored dark preference before first paint (Next's
            own beforeInteractive injection point, ahead of hydration) so it
            doesn't flash light then snap dark. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
