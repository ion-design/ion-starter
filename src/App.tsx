import React, { type ReactElement } from "react";
import { cn } from "@/lib/utils";
import { Route, Routes } from "react-router-dom";

function App(): ReactElement {
  return (
    <div
      className={cn(
        'absolute inset-0 z-0 overflow-hidden bg-background transition-opacity duration-300 ease-in-out bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
      )}
    >
      <style>
        {`
          @keyframes pulse-glow {
            0%, 100% {
              opacity: 0.4;
              transform: scale(1);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.05);
            }
          }
          @keyframes typing {
            0% { width: 0; }
            50% { width: 100%; }
            100% { width: 0; }
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>
      
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8">
        {/* AI Brain Icon */}
        <div className="relative">
          <div 
            className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"
            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-white"
            >
              <path
                d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9C15 10.1 14.1 11 13 11S11 10.1 11 9V7.5L5 7V9C5 10.1 4.1 11 3 11S1 10.1 1 9V7C1 5.9 1.9 5 3 5H21C22.1 5 23 5.9 23 7V9C23 10.1 22.1 11 21 11S19 10.1 19 9ZM12 13C13.1 13 14 13.9 14 15V17C14 18.1 13.1 19 12 19S10 18.1 10 17V15C10 13.9 10.9 13 12 13ZM18 13C19.1 13 20 13.9 20 15V17C20 18.1 19.1 19 18 19S16 18.1 16 17V15C16 13.9 16.9 13 18 13ZM6 13C7.1 13 8 13.9 8 15V17C8 18.1 7.1 19 6 19S4 18.1 4 17V15C4 13.9 4.9 13 6 13Z"
                fill="currentColor"
              />
            </svg>
          </div>
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-20" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }} />
          <div className="absolute inset-[-8px] rounded-full border border-purple-300 opacity-10" style={{ animation: 'pulse-glow 2s ease-in-out infinite 0.5s' }} />
        </div>

        {/* Status Text */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-white">AI is coding...</h2>
          
          {/* Typing animation */}
          <div className="flex items-center justify-center space-x-2">
            <div className="text-purple-300 font-mono text-sm">
              <span className="inline-block overflow-hidden whitespace-nowrap border-r-2 border-purple-400" style={{ animation: 'typing 3s steps(20) infinite, blink 1s step-end infinite' }}>
                Analyzing your request
              </span>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-purple-400 rounded-full"
                style={{
                  animation: 'pulse-glow 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
          </div>

          <p className="text-gray-400 text-sm max-w-md">
            Generating code with AI magic ✨
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;