import type { Metadata } from "next";
import "../styles/globals.css";
import { Navigation } from "../components/Navigation";
import { ThemeProvider } from "../components/ThemeProvider";

export const metadata: Metadata = {
  title: "NewsIQ",
  description: "RAG-powered news intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        <ThemeProvider>
          <Navigation />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
