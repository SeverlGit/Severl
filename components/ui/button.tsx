import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-rose/40 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:   "bg-brand-rose text-white hover:bg-brand-rose-deep active:scale-[0.98]",
        secondary: "bg-brand-plum-dim text-brand-plum-deep hover:bg-brand-plum/20",
        ghost:     "bg-surface-hover text-txt-secondary hover:bg-border",
        outline:   "border border-brand-rose/25 bg-brand-rose-dim text-brand-rose-deep hover:bg-brand-rose/20",
        danger:    "bg-danger text-white hover:bg-danger/90",
        link:      "text-brand-rose-deep underline-offset-4 hover:underline p-0 h-auto",
        // legacy alias kept for backwards-compatibility
        terminal:  "bg-brand-plum-dim text-brand-plum-deep hover:bg-brand-plum/20",
      },
      size: {
        sm:      "h-7 px-3 text-[11px] rounded",
        default: "h-8 px-4 text-[12px] rounded-md",
        lg:      "h-10 px-5 text-[13px] rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
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
