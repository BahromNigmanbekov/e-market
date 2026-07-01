"use client";

import { useEffect, useState } from "react";
import { productService } from "./api/index";
import ProductCard from "./_components/ProductCard";

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

  return (
    <div className="px-4 sm:px-8 py-10 bg-white min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center max-w-5xl mx-auto">
        Featured Products
      </h1>

      <div className="grid grid-cols-3 gap-x-5 gap-y-10 max-w-5xl mx-auto justify-items-center">
        {products.map((item) => (
          <ProductCard
            key={item.id}
            id={item.id}
            title={item.title}
            price={item.price}
            image={item.img?.[0] || ""}
          />
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-center text-gray-400 text-sm mt-10">
          Mahsulotlar topilmadi
        </p>
      )}
    </div>
  );
}