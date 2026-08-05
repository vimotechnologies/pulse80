import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const axiforma = localFont({
  src: [
    { path: "./fonts/Axiforma-Thin.ttf", weight: "100", style: "normal" },
    { path: "./fonts/Axiforma-ThinItalic.ttf", weight: "100", style: "italic" },
    { path: "./fonts/Axiforma-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/Axiforma-LightItalic.ttf", weight: "300", style: "italic" },
    { path: "./fonts/Axiforma-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Axiforma-Italic.ttf", weight: "400", style: "italic" },
    { path: "./fonts/Axiforma-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Axiforma-MediumItalic.ttf", weight: "500", style: "italic" },
    { path: "./fonts/Axiforma-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Axiforma-SemiBoldItalic.ttf", weight: "600", style: "italic" },
    { path: "./fonts/Axiforma-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Axiforma-BoldItalic.ttf", weight: "700", style: "italic" },
    { path: "./fonts/Axiforma-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "./fonts/Axiforma-ExtraBoldItalic.ttf", weight: "800", style: "italic" },
    { path: "./fonts/Axiforma-Black.ttf", weight: "900", style: "normal" },
    { path: "./fonts/Axiforma-BlackItalic.ttf", weight: "900", style: "italic" },
  ],
  display: "swap",
  variable: "--font-axiforma",
});

export const metadata: Metadata = {
  title: "Pulse80",
  description: "Enterprise wellness intelligence platform",
  icons: {
    icon: "/brand/pulse80-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${axiforma.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
