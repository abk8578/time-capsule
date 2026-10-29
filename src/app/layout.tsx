import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/nightsky/CustomCursor";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "600",
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Time Capsule - Letters to your future self",
  description:
    "Write messages to your future self, lock them until a chosen date, and receive an email when your capsule unlocks.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} h-full`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|; )theme=([^;]*)/);var t=m?decodeURIComponent(m[1]):null;if(!t){t=sessionStorage.getItem('theme')}if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text antialiased selection:bg-accent/30 selection:text-accent-text relative">
        {/* Subtle cinematic SVG film grain noise overlay */}
        <div className="film-grain" aria-hidden="true" />
        {/* Celestial trailing starlight cursor on desktop */}
        <CustomCursor />
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col relative z-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
