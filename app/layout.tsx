import React from "react";
import "./globals.css";

export const metadata = {
  title: "Severl",
  description: "Social media management OS for freelancers and agencies",
};
import { Poppins, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

// display: 'swap' prevents FOIT but can cause CLS when font loads.
// For dashboard apps with repeat visits, font-display: optional may reduce CLS.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const clerkAppearance = {
  variables: {
    colorBackground: "transparent",
    colorInputBackground: "rgba(255,255,255,0.05)",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "rgba(255,255,255,0.50)",
    colorPrimary: "#6EE7B7",
    colorDanger: "#f87171",
    borderRadius: "8px",
    fontFamily: "Poppins, system-ui, sans-serif",
  },
  elements: {
    rootBox: {
      width: "100%",
    },
    cardBox: {
      width: "100%",
    },
    card: {
      width: "100%",
      background: "transparent",
      boxShadow: "none",
      border: "none",
      padding: 0,
    },
    headerTitle: {
      color: "#ffffff",
      fontSize: "23px",
      fontWeight: "500",
    },
    headerSubtitle: {
      color: "rgba(255,255,255,0.40)",
      fontSize: "17px",
    },
    formButtonPrimary: {
      background: "#6EE7B7",
      color: "#0D1B2A",
      fontWeight: "500",
      fontSize: "18px",
      borderRadius: "7px",
      "&:hover": { background: "#5DD4A4" },
    },
    formFieldInput: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: "7px",
      color: "#ffffff",
      fontSize: "18px",
      "&:focus": {
        border: "1px solid rgba(110,231,183,0.40)",
        background: "rgba(255,255,255,0.08)",
      },
    },
    formFieldLabel: {
      color: "rgba(255,255,255,0.50)",
      fontSize: "16px",
    },
    footerActionText: {
      color: "rgba(255,255,255,0.40)",
    },
    footerActionLink: {
      color: "#6EE7B7",
    },
    dividerLine: {
      background: "rgba(255,255,255,0.08)",
    },
    dividerText: {
      color: "rgba(255,255,255,0.25)",
    },
    socialButtonsBlockButton: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.10)",
      color: "#fff",
      borderRadius: "7px",
      "&:hover": { background: "rgba(255,255,255,0.08)" },
    },
  },
} as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${jetbrainsMono.variable} font-sans`}>
      <body className={`${poppins.variable} ${jetbrainsMono.variable}`}>
        <ClerkProvider appearance={clerkAppearance}>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                fontFamily: "var(--font-poppins), system-ui, sans-serif",
                background: "#0D1B2A",
                color: "#ffffff",
                border: "1px solid #1e2d3d",
                fontSize: "14px",
                borderRadius: "8px",
              },
            }}
          />
        </ClerkProvider>
      </body>
    </html>
  );
}
