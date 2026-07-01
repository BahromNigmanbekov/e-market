"use client";

import { useEffect, useState } from "react";
import { productService } from "./api/index";
import ProductCard from "./_components/ProductCard";
import { FiSearch, FiX } from "react-icons/fi";

interface Product {
  id: string;
  title: string;
  price: number;
  desc: string;
  img: string[];
  category?: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await productService.getAll();
        setProducts(data);
      } catch (err) {
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400 text-sm">
        Yuklanmoqda...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-rose-500 text-sm">
        Xatolik: {error}
      </div>
    );
  }

  const filteredProducts = products.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.desc?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="px-4 sm:px-8 py-10 bg-white min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center max-w-5xl mx-auto">
        Featured Products
      </h1>

      {/* QIDIRUV */}
      <div className="max-w-md mx-auto mb-10">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mahsulot qidirish..."
            className="w-full h-12 pl-11 pr-10 rounded-full border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Tozalash"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
            >
              <FiX />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-10 max-w-5xl mx-auto justify-items-center">
        {filteredProducts.map((item) => (
          <ProductCard
            key={item.id}
            id={item.id}
            title={item.title}
            price={item.price}
            image={item.img?.[0] || ""}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <p className="text-center text-gray-400 text-sm mt-10">
          {query
            ? `"${query}" bo'yicha mahsulot topilmadi`
            : "Mahsulotlar topilmadi"}
        </p>
      )}
    </div>
  );
}