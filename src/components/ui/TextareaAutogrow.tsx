"use client";

import { forwardRef, useEffect, useRef, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaAutoGrowProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number;
}

const TextareaAutoGrow = forwardRef<HTMLTextAreaElement, TextareaAutoGrowProps>(
  ({ className, maxRows = 12, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const adjustHeight = () => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      const lineHeight = 24; // approximate
      const maxHeight = maxRows * lineHeight;
      const newHeight = Math.min(el.scrollHeight, maxHeight);
      el.style.height = `${newHeight}px`;
    };

    useEffect(() => {
      adjustHeight();
    }, [props.value]);

    return (
      <textarea
        {...props}
        ref={(node) => {
          textareaRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as any).current = node;
        }}
        rows={1}
        className={cn(
          "w-full resize-none overflow-hidden bg-transparent outline-none",
          "min-h-[52px] py-3.5 px-4",
          className,
        )}
        onInput={adjustHeight}
      />
    );
  },
);

TextareaAutoGrow.displayName = "TextareaAutoGrow";

export { TextareaAutoGrow };
