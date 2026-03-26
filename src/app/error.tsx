"use client"; // <--- Add this exactly like this

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-xl font-bold mb-4">Neural Link Interrupted</h2>
      <p className="text-slate-500 mb-6 text-center max-w-md">
        An unexpected error occurred in the PurpleChat engine.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-violet-600 text-white rounded-xl font-medium"
      >
        Try Again
      </button>
    </div>
  );
}
