import React from "react";

export default function Loader() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}