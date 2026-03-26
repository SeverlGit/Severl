import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-border bg-[rgba(255,255,255,0.05)] px-3 py-2 text-[17px] text-white shadow-none placeholder:text-[rgba(255,255,255,0.25)] focus-visible:outline-none focus-visible:border-[rgba(110,231,183,0.40)] focus-visible:ring-1 focus-visible:ring-[rgba(110,231,183,0.10)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
