import type { Metadata, Viewport } from "next";
import { APP_INFO } from "@/config";
import { Layout } from "@/components";
import { GoogleAnalytics } from "@next/third-parties/google";
import "@/styles/globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <Layout>{children}</Layout>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  alternates: {
    canonical: APP_INFO.url,
  },
  title: {
    default: APP_INFO.title,
    template: APP_INFO.titleTemplate,
  },
  description: APP_INFO.description,
  keywords: APP_INFO.keywords,
  authors: APP_INFO.authors,
  creator: APP_INFO.authors[0].name,
  publisher: APP_INFO.authors[0].name,
  generator: "Next.js",
  applicationName: APP_INFO.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_INFO.title,
  },
  metadataBase: new URL(APP_INFO.url),
  category: "website",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_INFO.name,
    title: {
      default: APP_INFO.title,
      template: APP_INFO.titleTemplate,
    },
    description: APP_INFO.description,
    locale: "ko_KR",
    url: new URL(APP_INFO.url),
    images: {
      url: "/icons/op-image.png",
      width: 1200,
      height: 630,
      alt: APP_INFO.name,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: APP_INFO.title,
    description: APP_INFO.description,
    images: ["/icons/op-image.png"],
  },
  verification: {},
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: {
      rel: "mask-icon",
      url: "/icons/safari-pinned-tab.svg",
      color: "#fff",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor: "#fff",
  viewportFit: "cover",
};
