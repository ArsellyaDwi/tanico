'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="w-full bg-[#FCFCFC] min-h-[70vh] pb-16 antialiased font-jost text-left">
      {/* Top Banner Skeleton */}
      <div className="w-full bg-emerald-950/5 py-12 px-6 md:px-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="h-3 w-28 bg-gray-200/80 rounded-full animate-pulse" />
          <div className="h-7 sm:h-9 w-64 sm:w-96 bg-gray-200/80 rounded-xl animate-pulse" />
          <div className="h-4 w-72 sm:w-[480px] bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E7E7E7] overflow-hidden p-3 flex flex-col gap-3 animate-pulse"
            >
              <div className="aspect-square w-full bg-gray-200/80 rounded-xl" />
              <div className="space-y-2 pt-1">
                <div className="h-3.5 w-3/4 bg-gray-200/80 rounded-md" />
                <div className="h-3 w-1/2 bg-gray-100 rounded-md" />
                <div className="h-4 w-2/3 bg-gray-200/80 rounded-md pt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

