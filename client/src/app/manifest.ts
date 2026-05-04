import type { MetadataRoute } from "next";
import { APP_INFO } from "@/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_INFO.name,
    short_name: "TYPOFOLD",
    description: APP_INFO.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#111111",
    background_color: "#111111",
    icons: [
      {
        src: "/icons/favicon.ico",
        sizes: "64x64 32x32 24x24 16x16",
        type: "image/x-icon",
      },
      {
        src: "/icons/android-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/android-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/android-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/android-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
