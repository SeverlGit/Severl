import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-[16px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-mint/40 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] transition-transform duration-100",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-mint text-brand-navy hover:bg-brand-mint/90 border-0",
        secondary:
          "bg-[rgba(255,255,255,0.05)] text-txt-muted border border-border hover:bg-[rgba(255,255,255,0.08)] hover:text-txt-primary",
        ghost:
          "bg-transparent text-txt-hint hover:text-txt-primary hover:bg-[rgba(255,255,255,0.04)]",
        danger:
          "bg-danger-bg text-danger border border-danger-border hover:bg-danger/20",
        terminal:
          "bg-success-bg text-brand-mint border border-success-border hover:bg-success-bg/80",
        link: "text-brand-mint underline-offset-4 hover:underline bg-transparent",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-7 px-2.5 text-[14px]",
        lg: "h-10 px-5",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
