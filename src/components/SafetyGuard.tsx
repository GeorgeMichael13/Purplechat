"use client";

import { useEffect } from "react";

export default function SafetyGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalStartsWith = String.prototype.startsWith;

    String.prototype.startsWith = function (search: string) {
      if (this == null || this === undefined) {
        console.warn(
          "🚨 startsWith was called on undefined/null — prevented crash",
        );
        return false;
      }
      return originalStartsWith.call(this, search);
    };

    return () => {
      String.prototype.startsWith = originalStartsWith; // cleanup
    };
  }, []);

  return null; // invisible component
}
