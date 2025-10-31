import React from "react";

export default function Loader({ message = "Cargando tu experiencia en MilAutónomos..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      {/* ✅ Loader ligero con CSS puro */}
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      
      <p className="text-gray-700 text-center font-medium animate-pulse">
        {message}
      </p>
    </div>
  );
}