"use client";

import { useEffect } from "react";

export default function SafetyGuard() {
  useEffect(() => {
    const originalStartsWith = String.prototype.startsWith;

    String.prototype.startsWith = function (search: any) {
      if (typeof this !== "string") {
        console.warn("🚨 Prevented startsWith() call on undefined/null value");
        return false;
      }
      return originalStartsWith.call(this, search);
    };

    return () => {
      String.prototype.startsWith = originalStartsWith;
    };
  }, []);

  return null;
}
