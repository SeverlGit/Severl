import React from "react";
import "./globals.css";

export const metadata = {
  title: "Severl",
  description: "Social media management OS for freelancers and agencies",
};

import { Fraunces, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const clerkAppearance = {
  variables: {
    colorPrimary:         "#C4909A",
    colorBackground:      "#FAF7F4",
    colorText:            "#1A1714",
    colorInputBackground: "#E8E2D9",
    colorInputText:       "#1A1714",
    borderRadius:         "8px",
  },
  elements: {
    card:              "bg-panel border border-border shadow-none",
    formButtonPrimary: "bg-brand-rose hover:bg-brand-rose-deep text-white",
    formFieldInput:    "bg-surface-hover border-border focus:border-brand-rose",
    footerAction:      "text-txt-muted",
  },
} as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body>
        <ClerkProvider appearance={clerkAppearance}>
          {children}
          <Toaster
            position="bottom-right"
            theme="light"
            toastOptions={{
              style: {
                background:   "#FAF7F4",
                color:        "#1A1714",
                border:       "1px solid #DDD7CE",
                fontSize:     "13px",
                borderRadius: "8px",
                fontFamily:   "var(--font-dm-sans)",
              },
            }}
          />
        </ClerkProvider>
      </body>
    </html>
  );
}
