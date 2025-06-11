import React, { type ReactElement } from "react";
import { cn } from "@/lib/utils";
import { Route, Routes } from "react-router-dom";

function App(): ReactElement {
  return (
    <div
      className={cn(
        'absolute inset-0 z-0 overflow-hidden bg-white flex items-center justify-center',
      )}
    >
      <div className="text-center space-y-4 max-w-sm mx-auto px-6">
        <div className="space-y-2">
          <h1 className="text-lg font-normal text-gray-800">
            Empty canvas
          </h1>
          <p className="text-gray-400 text-xs">
            Awaiting your next creation
          </p>
        </div>

        <div className="w-12 h-px bg-gray-300 mx-auto" />

        <p className="text-gray-300 text-xs uppercase tracking-wide">
          Placeholder
        </p>
      </div>
    </div>
  );
}

export default App;