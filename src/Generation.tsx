import { Paintbrush, RefreshCw, Ship } from "lucide-react";
import React from "react";

const WelcomePage = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden h-full w-full">
        {/* Abstract Background Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full -translate-x-1/3 -translate-y-1/3 blur-[80px]" />
          <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-blue-200/30 rounded-full translate-x-1/3 -translate-y-1/2 blur-[70px]" />
          <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-blue-300/30 rounded-full -translate-x-1/2 translate-y-1/3 blur-[80px]" />
        </div>

        <div className="relative w-full h-full flex items-center justify-center p-6 pb-40">
          <div className="max-w-3xl w-full space-y-6">
            {/* Main Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg transition-all duration-300 hover:shadow-xl p-6">
              <h2 className="text-base font-medium text-gray-700 mb-4">
                This is the base template for your ion project.
              </h2>
              <p className="text-sm text-gray-500">
                This template is built with the latest version of ion, vite, and
                typescript. ion will use this template to generate your project.
              </p>
              <p className="text-sm text-gray-500">
                Unfamiliar with ion? Go to{" "}
                <a
                  href="https://www.ion.design"
                  className="text-blue-500 hover:underline"
                >
                  ion.design
                </a>{" "}
                to learn more.
              </p>

              <div className="space-y-4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
