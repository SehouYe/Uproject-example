import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import SessionWrapper from "@/components/SessionWrapper"; // ✅ import wrapper

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Language Exchange",
  description: "Matching demo (native ↔ target)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* ✅ Use the client Session wrapper here */}
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
