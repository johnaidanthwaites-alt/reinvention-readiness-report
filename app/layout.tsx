import type { Metadata } from "next";
import { Bitter, Raleway } from "next/font/google";
import "./globals.css";

const bitter = Bitter({
  variable: "--font-bitter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Your Reinvention Readiness Report: GoReinvent",
  description:
    "Answer 9 questions and receive a personalised Reinvention Readiness Report based on your specific situation, skills, and goals.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bitter.variable} ${raleway.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
