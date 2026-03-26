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
  layout: {
    socialButtonsPlacement: "bottom" as const,
    socialButtonsVariant:   "iconButton" as const,
  },
  variables: {
    colorPrimary:         "#C4909A",
    colorBackground:      "#FAF7F4",
    colorText:            "#1A1714",
    colorTextSecondary:   "#6B6560",
    colorInputBackground: "#E8E2D9",
    colorInputText:       "#1A1714",
    colorNeutral:         "#A09890",
    colorDanger:          "#C05A48",
    colorSuccess:         "#5A8A6A",
    borderRadius:         "8px",
    fontFamily:           "var(--font-dm-sans)",
    fontSize:             "13px",
  },
  elements: {
    rootBox:                  "w-full",
    card:                     "bg-panel border border-border shadow-none rounded-xl p-6",
    headerTitle:              "font-sans text-[17px] font-semibold text-txt-primary tracking-[-0.01em]",
    headerSubtitle:           "font-sans text-[13px] text-txt-muted",
    formButtonPrimary:        "bg-brand-rose hover:bg-brand-rose-deep text-white font-sans text-[13px] font-medium rounded-md transition-colors",
    formFieldInput:           "bg-surface-hover border border-border focus:border-brand-rose font-sans text-[13px] rounded-md",
    formFieldLabel:           "font-sans text-[12px] font-medium text-txt-secondary",
    footerAction:             "text-txt-muted font-sans text-[12px]",
    footerActionLink:         "text-brand-rose-deep font-medium hover:text-brand-rose",
    socialButtonsBlockButton: "bg-surface border border-border hover:bg-surface-hover font-sans text-[13px] text-txt-secondary rounded-md",
    dividerLine:              "bg-border",
    dividerText:              "text-txt-muted font-sans text-[12px]",
    identityPreviewText:      "text-txt-secondary font-sans text-[13px]",
    identityPreviewEditButton: "text-brand-rose-deep font-sans text-[12px]",
    formResendCodeLink:       "text-brand-rose-deep",
    otpCodeFieldInput:        "bg-surface-hover border border-border font-sans rounded-md",
    alertText:                "font-sans text-[12px]",
  },
} as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="font-sans bg-page text-txt-primary">
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
