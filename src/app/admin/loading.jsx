export default function AdminLoading() {
  return (
    <div className="w-full bg-[#FCFCFC] p-6 space-y-8 font-sans animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DDE9DF] pb-6">
        <div className="space-y-2">
          <div className="h-3 w-28 bg-gray-200 rounded-full" />
          <div className="h-7 w-56 bg-gray-200 rounded-lg" />
          <div className="h-3.5 w-72 bg-gray-100 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-gray-200 rounded-xl" />
          <div className="h-9 w-32 bg-gray-200 rounded-xl" />
        </div>
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#DDE9DF] p-5 rounded-2xl shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-gray-200 rounded-md" />
              <div className="w-8 h-8 rounded-xl bg-gray-100" />
            </div>
            <div className="h-6 w-32 bg-gray-200 rounded-lg" />
            <div className="h-3 w-20 bg-gray-100 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Content & Chart Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart/Table Skeleton */}
        <div className="lg:col-span-2 bg-white border border-[#DDE9DF] p-6 rounded-2xl shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div className="h-5 w-40 bg-gray-200 rounded-md" />
            <div className="h-4 w-20 bg-gray-100 rounded-md" />
          </div>
          <div className="h-64 w-full bg-gray-100/70 rounded-xl flex items-end justify-between p-4 gap-3">
            {[40, 65, 30, 85, 50, 75, 60, 90].map((h, idx) => (
              <div key={idx} className="w-full bg-gray-200/80 rounded-t-md" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Side Panel Activity Skeleton */}
        <div className="bg-white border border-[#DDE9DF] p-6 rounded-2xl shadow-2xs space-y-4">
          <div className="h-5 w-36 bg-gray-200 rounded-md border-b border-gray-100 pb-4" />
          <div className="space-y-4 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                <div className="space-y-1.5 w-full">
                  <div className="h-3.5 w-3/4 bg-gray-200 rounded-md" />
                  <div className="h-2.5 w-1/2 bg-gray-100 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

