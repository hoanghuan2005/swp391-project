import React from 'react';
import { useLocation } from 'react-router-dom';

export default function ComingSoon() {
  const location = useLocation();
  const pageName = location.pathname.split('/').pop().replace('-', ' ') || 'Page';

  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <span className="text-3xl text-blue-500 font-bold">🚀</span>
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2 capitalize">{pageName}</h1>
      <p className="text-slate-500 max-w-md mx-auto">
        This feature is currently under development. Stay tuned for updates!
      </p>
    </div>
  );
}
