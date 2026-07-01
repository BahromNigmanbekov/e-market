"use client";

import Link from "next/link";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  currency?: string;
}

export default function ProductCard({
  id,
  title,
  price,
  image,
  currency = "so'm",
}: ProductCardProps) {
  return (
    <Link
      href={`/product/${id}`}
      className="group block w-full max-w-[280px] bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] overflow-hidden mx-auto transition-shadow duration-300"
    >
      {/* Rasm qismi */}
      <div className="flex items-center justify-center bg-white px-8 pt-8 pb-6 h-64">
        <img
          src={image}
          alt={title}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://placehold.co/240x240?text=Image";
          }}
          className="max-w-full max-h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>

      {/* Ajratuvchi chiziq */}
      <div className="border-t border-gray-100" />

      {/* Matn qismi */}
      <div className="px-5 py-4">
        <h2 className="text-[15px] font-bold text-gray-900 leading-snug">
          {title}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {price} {currency}
        </p>
      </div>
    </Link>
  );
}