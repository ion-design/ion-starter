import React, { type ReactElement } from "react";
import { cn } from "@/lib/utils";
import { Route, Routes } from "react-router-dom";

function App(): ReactElement {
  return (
    <div
      className={cn(
        'absolute inset-0 z-0 overflow-hidden bg-gray-50 flex items-center justify-center',
      )}
    >
      <div className="text-center space-y-6 max-w-md mx-auto px-8">
        {/* Simple placeholder icon */}
        <div className="w-16 h-16 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>

        <div className="space-y-3">
          <h1 className="text-xl font-medium text-gray-900">
            Waiting for content
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            This is a placeholder screen. The AI will replace this with your requested content.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Ready to be replaced
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;