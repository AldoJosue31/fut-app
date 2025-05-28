import React from 'react';

const cajaEquipo = ({ nombre, color }) => {
  return (
    <div className="flex items-center border border-gray-600 rounded-lg overflow-hidden mb-2 bg-gray-700">
      <div
        className={`h-12 w-12 ${color} flex-shrink-0`}
        style={{ clipPath: "polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)" }}
      ></div>
      <div className="flex-1 flex items-center px-4">
        <span className="text-white font-medium text-base">{nombre}</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 bg-green-600 hover:bg-green-500 text-white rounded-full flex items-center justify-center">
          ✔
        </button>
        <button className="w-8 h-8 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center">
          ✘
        </button>
      </div>
    </div>
  );
};

export default cajaEquipo;
