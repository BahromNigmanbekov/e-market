"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiHeart,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiTruck,
  FiBox,
  FiCheckCircle,
  FiArrowLeft,
} from "react-icons/fi";
import { productService } from "../../api/index";

interface Product {
  id: string;
  title: string;
  price: number;
  desc: string;
  img: string[];
  category?: string;
}

// Backendda yo'q, dizaynga mos statik qiymatlar (keyinchalik API ga ulash mumkin)
const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];
const DEFAULT_UNAVAILABLE_SIZES: string[] = [];
const DEFAULT_DELIVERY_DAYS = "3-4 Working Days";
const DEFAULT_PACKAGE_TYPE = "Regular Package";
const DEFAULT_ARRIVAL = "3-4 kun ichida";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [descOpen, setDescOpen] = useState(true);
  const [shipOpen, setShipOpen] = useState(true);
  const [sending, setSending] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await productService.getById(id);
        setProduct(data);
      } catch (err) {
        setLoadError("Mahsulotni yuklashda xatolik yuz berdi.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const diff = Math.max(0, end.getTime() - now.getTime());
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setCountdown(`${h}:${m}:${s}`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400 text-sm bg-white">
        Yuklanmoqda...
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4 bg-white">
        <p className="text-sm text-rose-500">
          {loadError || "Mahsulot topilmadi"}
        </p>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <FiArrowLeft /> Bosh sahifaga qaytish
        </button>
      </div>
    );
  }

  const mainImage = product.img?.[0] || "";
  const total = (product.price * quantity).toFixed(2);

  const handleOrder = async () => {
    if (DEFAULT_SIZES.length > 0 && !selectedSize) {
      setOrderError("Iltimos, o'lchamni tanlang");
      return;
    }
    setOrderError(null);
    setSending(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          title: product.title,
          size: selectedSize,
          quantity,
          unitPrice: product.price,
          totalPrice: Number(total),
          currency: "$",
        }),
      });
      if (!res.ok) throw new Error("Xatolik yuz berdi");
      setOrderSent(true);
      setTimeout(() => setOrderSent(false), 3000);
    } catch (e) {
      setOrderError("Buyurtmani yuborib bo'lmadi, qayta urinib ko'ring");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 bg-white min-h-screen">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <FiArrowLeft /> Orqaga
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
        {/* RASM */}
        <div className="w-full flex items-center justify-center">
          <div className="w-full max-h-[420px] sm:max-h-[480px] md:max-h-[560px] aspect-square flex items-center justify-center">
            <img
              src={mainImage}
              alt={product.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/500x600?text=Image";
              }}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* MALUMOT */}
        <div className="flex flex-col">
          {product.category && (
            <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">
              {product.category}
            </p>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
            {product.title}
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-3">
            ${product.price.toFixed(2)}
          </p>

          <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
            <FiClock className="shrink-0" />
            <span>
              Ertaga yetkazib berish uchun{" "}
              <span className="font-semibold text-gray-900">{countdown}</span>{" "}
              ichida buyurtma bering
            </span>
          </div>

          {/* SIZE */}
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              O'lchamni tanlang
            </p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_SIZES.map((size) => {
                const disabled = DEFAULT_UNAVAILABLE_SIZES.includes(size);
                const selected = selectedSize === size;
                return (
                  <button
                    key={size}
                    disabled={disabled}
                    onClick={() => setSelectedSize(size)}
                    className={`h-11 min-w-[44px] px-4 rounded-full text-sm font-medium border transition-colors
                      ${
                        disabled
                          ? "border-gray-100 text-gray-300 cursor-not-allowed"
                          : selected
                          ? "bg-gray-900 text-white border-gray-900"
                          : "border-gray-200 text-gray-700 hover:border-gray-900"
                      }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {orderError && (
              <p className="text-xs text-red-500 mt-2">{orderError}</p>
            )}
          </div>

          {/* MIQDOR */}
          <div className="mt-4 flex items-center gap-3">
            <p className="text-sm font-semibold text-gray-900">Miqdor</p>
            <div className="flex items-center border border-gray-200 rounded-full">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900"
              >
                +
              </button>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleOrder}
              disabled={sending}
              className="flex-1 h-12 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {sending
                ? "Yuborilmoqda..."
                : orderSent
                ? "Buyurtma qabul qilindi ✓"
                : `Buyurtma berish — $${total}`}
            </button>
            <button
              onClick={() => setLiked((v) => !v)}
              aria-label="Sevimlilarga qo'shish"
              className={`w-12 h-12 shrink-0 rounded-full border flex items-center justify-center transition-colors
                ${
                  liked
                    ? "border-gray-900 text-gray-900"
                    : "border-gray-200 text-gray-400 hover:text-gray-900"
                }`}
            >
              <FiHeart className={liked ? "fill-current" : ""} />
            </button>
          </div>

          {orderSent && (
            <div className="flex items-center gap-2 text-sm text-green-600 mt-3">
              <FiCheckCircle /> Buyurtmangiz qabul qilindi, tez orada bog'lanamiz
            </div>
          )}

          {/* ACCORDION: Description */}
          <div className="border-t border-gray-100 mt-5 pt-4">
            <button
              onClick={() => setDescOpen((v) => !v)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-gray-900">
                Tavsif va material
              </span>
              {descOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {descOpen && (
              <p className="text-sm text-gray-500 leading-relaxed mt-3">
                {product.desc}
              </p>
            )}
          </div>

          {/* ACCORDION: Shipping */}
          <div className="border-t border-gray-100 mt-4 pt-4 pb-2">
            <button
              onClick={() => setShipOpen((v) => !v)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-gray-900">
                Yetkazib berish
              </span>
              {shipOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {shipOpen && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-start gap-2">
                  <FiTruck className="text-gray-900 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Yetkazib berish</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {DEFAULT_DELIVERY_DAYS}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FiBox className="text-gray-900 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Paket turi</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {DEFAULT_PACKAGE_TYPE}
                    </p>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Yetib borish sanasi</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {DEFAULT_ARRIVAL}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}