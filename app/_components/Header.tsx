"use client";

import Link from "next/link";
import React from "react";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/">
          <h1 className="text-lg font-semibold text-gray-900">Paxta/</h1>
        </Link>

        <Link href="/dashboard">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition"
          >
            Dashboard
          </button>
        </Link>
      </div>
    </header>
  );
}