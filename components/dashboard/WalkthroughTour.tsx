"use client";

import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import { markUIMetaSeen } from "@/lib/onboarding-actions";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, CheckSquare, Receipt, ArrowRight, ArrowLeft, Check } from "lucide-react";

type Slide = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
};

const SLIDES: Slide[] = [
  {
    id: "welcome",
    title: "Welcome to Severl",
    description: "Your entire freelance or agency business, orchestrated from one place. Let's take a quick look around.",
    icon: LayoutDashboard,
  },
  {
    id: "clients",
    title: "The CRM",
    description: "Add clients, set their retainer amounts, and track contract renewals. This acts as the backbone for your billing and deliverables.",
    icon: Users,
  },
  {
    id: "deliverables",
    title: "Tracking Work",
    description: "Manage monthly retainers with a Kanban board. Drag deliverables from 'Not Started' to 'Published' to keep clients organized.",
    icon: CheckSquare,
  },
  {
    id: "invoices",
    title: "Automated Billing",
    description: "Generate monthly invoices automatically based on client retainers, or draft custom ad-hoc invoices in seconds.",
    icon: Receipt,
  },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasSeen: boolean;
};

export function WalkthroughTour({ open, onOpenChange, hasSeen }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const isLast = step === SLIDES.length - 1;
  const isFirst = step === 0;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleComplete = async () => {
    onOpenChange(false);
    // Reset step after animation completes
    setTimeout(() => setStep(0), 300);
    if (!hasSeen) {
      await markUIMetaSeen("has_seen_tour");
    }
  };

  const currentSlide = SLIDES[step];
  const Icon = currentSlide.icon;

  return (
    <Dialog 
      open={open} 
      onOpenChange={(v) => {
        if (!v) handleComplete();
      }}
    >
      <DialogContent 
        className="overflow-hidden p-0 max-w-md bg-panel border-border shadow-2xl"
        size="md"
        // Prevent clicking outside if they haven't seen it yet
        onInteractOutside={(e) => {
          if (!hasSeen) e.preventDefault();
        }}
      >
        <div className="relative h-[320px] w-full flex flex-col items-center justify-center bg-surface border-b border-border-subtle p-8 overflow-hidden rounded-t-lg">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-rose/5 to-brand-plum/5" />
          
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.div
              key={currentSlide.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -40, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-hover border border-border shadow-sm mb-6">
                <Icon className="h-8 w-8 text-brand-rose" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold text-txt-primary mb-2">
                {currentSlide.title}
              </h2>
              <p className="text-[13px] leading-relaxed text-txt-muted max-w-[280px]">
                {currentSlide.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-panel">
          {/* Pagination Dots */}
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step ? "w-4 bg-brand-rose" : "w-1.5 bg-border-strong"
                )}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded transition-colors",
                isFirst 
                  ? "text-txt-hint cursor-not-allowed opacity-50" 
                  : "text-txt-muted hover:bg-surface-hover hover:text-txt-primary"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className={cn(
                "flex h-9 items-center justify-center gap-1.5 rounded px-4 text-sm font-medium transition-colors border",
                isLast
                  ? "bg-success border-success text-white shadow-sm hover:bg-success/90"
                  : "bg-surface border-border text-txt-primary hover:bg-surface-hover shadow-sm"
              )}
            >
              {isLast ? (
                <>Get Started <Check className="h-4 w-4" /></>
              ) : (
                <>Next <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
