import React, { type ReactElement } from "react";
import { cn } from "@/lib/utils";
import { Route, Routes } from "react-router-dom";

function App(): ReactElement {
  // REMOVE ME
  const shimmerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: '0',
    transform: 'translateX(-100%)',
    background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent)',
    animation: 'shimmer 4s infinite'
  }
  return (
    <Routes>
      <Route path="/" element={
           <div
           className={cn(
             'absolute inset-0 z-0 overflow-hidden bg-background transition-opacity duration-300 ease-in-out bg-black',
           )}
         >
           <style>
            {`
            @keyframes shimmer {
     0% {
       transform: translateX(-100%);
     }
     100% {
       transform: translateX(100%);
     }
   } `}
           </style>
           <div style={shimmerStyle}></div>
           <div className="absolute inset-0 flex items-center justify-center">
           <svg viewBox="0 0 394 394" fill="none" xmlns="http://www.w3.org/2000/svg" className='w-12 h-12 opacity-20 text-[#f1c115]'>
         <path
           fillRule="evenodd"
           clipRule="evenodd"
           d="M156.791 236.518H0V156.791C86.5529 156.791 156.791 86.5349 156.791 0H236.536V156.791H393.326V236.518C306.773 236.518 236.536 306.774 236.536 393.306H156.791V236.518Z"
           fill="currentColor"
         />
       </svg>
           </div>
         </div>
      } />
    </Routes>
  );
}

export default App;
