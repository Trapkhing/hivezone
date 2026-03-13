import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const newYork = localFont({
  src: "./fonts/newyork/newyork.otf",
  variable: "--font-newyork",
});

const manyto = localFont({
  src: [
    {
      path: "./fonts/manyto/Manyto.woff2",
      weight: "normal",
      style: "normal",
    },
    {
      path: "./fonts/manyto/Manyto.otf",
      weight: "normal",
      style: "normal",
    }
  ],
  variable: "--font-manyto",
});

export const metadata = {
  metadataBase: new URL("http://localhost:3000"), // Will resolve according to environment
  title: "HiveZone | Your Campus Hub",
  description: "Connect with peers, find gigs, discover internships, and thrive in your campus zone.",
  applicationName: "HiveZone",
  keywords: ["campus", "university", "student gigs", "internships", "scholarships", "college"],
  authors: [{ name: "HiveZone Team" }],
  openGraph: {
    title: "HiveZone | Your Campus Hub",
    description: "Your campus, your zone, your hive. Connect with peers, find gigs, and thrive.",
    url: "https://hivezone.vercel.app",
    siteName: "HiveZone",
    images: [
      {
        url: "/logo.png", // Fallback OG image
        width: 1200,
        height: 630,
        alt: "HiveZone Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HiveZone | Your Campus Hub",
    description: "Connect with peers, find gigs, discover internships, and thrive in your campus zone.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logoIcon.svg",
    apple: "/logoIcon.svg",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  colorScheme: "light",
};

import { UIProvider } from "@/components/ui/UIProvider";
import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <head>
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              try {
                OneSignal.Debug.setLogLevel("none");
                await OneSignal.init({
                  appId: "b9314dfb-651e-4f29-b1e9-c1f6f2300b0e",
                  allowLocalhostAsSecureOrigin: true,
                  notifyButton: {
                    enable: true,
                  },
                });
              } catch (e) {
                // Ignore OneSignal initialization errors (e.g., domain restriction on localhost)
              }
            });
          `}
        </Script>
      </head>
      <body
        className={`${newYork.variable} ${inter.variable} ${manyto.variable} antialiased`}
      >
        <UIProvider>
          {children}
        </UIProvider>
      </body>
    </html>
  );
}
