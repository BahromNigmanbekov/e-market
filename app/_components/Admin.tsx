"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaSearch,
  FaPlus,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaEllipsisV,
  FaEye,
  FaPen,
  FaTrashAlt,
  FaTable,
  FaThLarge,
  FaFilter,
  FaFileImport,
  FaChevronDown,
  FaCheck,
} from "react-icons/fa";
import { productService } from "../api/index";

type Status = "Active" | "Pre-Order" | "Out of Stock";

interface Product {
  id: string;
  title: string;
  price: number;
  desc: string;
  img: string[];
  category?: string;
  stock?: number;
  status?: Status;
}

interface ProductFormState {
  title: string;
  price: number;
  desc: string;
  img: string;
  category: string;
  stock: number;
}

const EMPTY_FORM: ProductFormState = {
  title: "",
  price: 0,
  desc: "",
  img: "",
  category: "",
  stock: 0,
};

function deriveStatus(stock?: number): Status {
  const s = stock ?? 0;
  if (s <= 0) return "Out of Stock";
  if (s <= 5) return "Pre-Order";
  return "Active";
}

function statusClasses(status: Status) {
  switch (status) {
    case "Active":
      return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200";
    case "Pre-Order":
      return "bg-amber-50 text-amber-600 ring-1 ring-amber-200";
    default:
      return "bg-rose-50 text-rose-600 ring-1 ring-rose-200";
  }
}

function formatId(id: string) {
  return `#PRD-${id.toString().padStart(3, "0")}`;
}

function formatPrice(price: number) {
  return `$${price?.toLocaleString("en-US") ?? 0}`;
}

const ALL_COLUMNS = [
  { key: "id", label: "Product ID" },
  { key: "name", label: "Name Product" },
  { key: "category", label: "Category" },
  { key: "stock", label: "Stock" },
  { key: "price", label: "Total" },
  { key: "status", label: "Status" },
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

export default function Admin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(ALL_COLUMNS.map((c) => c.key))
  );
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const viewMenuRef = useRef<HTMLDivElement>(null);
  const columnsMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await productService.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (viewMenuRef.current && !viewMenuRef.current.contains(target))
        setIsViewMenuOpen(false);
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(target))
        setIsColumnsMenuOpen(false);
      if (filterMenuRef.current && !filterMenuRef.current.contains(target))
        setIsFilterMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products]
  );

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const matchesSearch = (p.title ?? "")
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "All" || deriveStatus(p.stock) === statusFilter;
        const matchesCategory =
          categoryFilter === "All" || p.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      }),
    [products, search, statusFilter, categoryFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIdx, startIdx + itemsPerPage);

  const rangeStart = filtered.length === 0 ? 0 : startIdx + 1;
  const rangeEnd = Math.min(startIdx + itemsPerPage, filtered.length);

  const allCurrentSelected =
    currentItems.length > 0 && currentItems.every((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCurrentSelected) currentItems.forEach((p) => next.delete(p.id));
      else currentItems.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key) && next.size > 1) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      title: p.title ?? "",
      price: p.price ?? 0,
      desc: p.desc ?? "",
      img: p.img?.[0] ?? "",
      category: p.category ?? "",
      stock: p.stock ?? 0,
    });
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setErrorMsg("Mahsulot nomini kiriting");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const payload: Partial<Product> = {
        title: formData.title.trim(),
        price: Number(formData.price) || 0,
        desc: formData.desc,
        img: [formData.img],
        category: formData.category,
        stock: Number(formData.stock) || 0,
        status: deriveStatus(Number(formData.stock)),
      };

      if (editingId) {
        await productService.update(editingId, payload);
      } else {
        await productService.create(payload);
      }

      closeModal();
      await fetchProducts();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (p: Product) => {
    setDeleteTarget(p);
    setOpenMenuId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      await productService.remove(deleteTarget.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      setDeleteTarget(null);
      await fetchProducts();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "O'chirishda xatolik");
    } finally {
      setDeleting(false);
    }
  };

  const col = (key: ColumnKey) => visibleColumns.has(key);
  const activeFiltersCount =
    (statusFilter !== "All" ? 1 : 0) + (categoryFilter !== "All" ? 1 : 0);

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900">
      <div className="sticky top-0 z-30 bg-gray-50 px-6 md:px-8 pt-6 md:pt-8 pb-4">
        <div className="max-w-7xl mx-auto w-full">
          <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              Management Product
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative" ref={viewMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsViewMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  {viewMode === "table" ? (
                    <FaTable className="text-gray-400" />
                  ) : (
                    <FaThLarge className="text-gray-400" />
                  )}
                  {viewMode === "table" ? "Table" : "Grid"}
                  <FaChevronDown className="text-[10px] text-gray-400" />
                </button>
                {isViewMenuOpen && (
                  <div className="absolute left-0 top-12 z-20 w-40 bg-white rounded-xl shadow-lg ring-1 ring-gray-100 py-1.5 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("table");
                        setIsViewMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-gray-600 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2">
                        <FaTable className="text-gray-400" /> Table
                      </span>
                      {viewMode === "table" && <FaCheck className="text-blue-500 text-xs" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("grid");
                        setIsViewMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-gray-600 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2">
                        <FaThLarge className="text-gray-400" /> Grid
                      </span>
                      {viewMode === "grid" && <FaCheck className="text-blue-500 text-xs" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="relative" ref={columnsMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsColumnsMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  <FaThLarge className="text-gray-400" />
                  Columns
                  <FaChevronDown className="text-[10px] text-gray-400" />
                </button>
                {isColumnsMenuOpen && (
                  <div className="absolute left-0 top-12 z-20 w-48 bg-white rounded-xl shadow-lg ring-1 ring-gray-100 py-1.5 text-sm max-h-72 overflow-auto">
                    {ALL_COLUMNS.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => toggleColumn(c.key)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-gray-600 hover:bg-gray-50"
                      >
                        <span>{c.label}</span>
                        {visibleColumns.has(c.key) && (
                          <FaCheck className="text-blue-500 text-xs" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search"
                  className="pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:ring-2 ring-blue-500 w-44 md:w-56"
                />
              </div>

              <div className="relative" ref={filterMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsFilterMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition relative"
                >
                  <FaFilter className="text-gray-400" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                {isFilterMenuOpen && (
                  <div className="absolute right-0 top-12 z-20 w-64 bg-white rounded-xl shadow-lg ring-1 ring-gray-100 p-4 text-sm space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                        Status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(["All", "Active", "Pre-Order", "Out of Stock"] as const).map(
                          (s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setStatusFilter(s)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                                statusFilter === s
                                  ? "bg-gray-900 text-white border-gray-900"
                                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {s}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                        Category
                      </p>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 ring-blue-500"
                      >
                        <option value="All">Barchasi</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("All");
                        setCategoryFilter("All");
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Filtrlarni tozalash
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition"
              >
                <FaPlus className="text-xs" />
                Add Product
              </button>

              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                <FaFileImport className="text-xs" />
                Import Product
              </button>
            </div>
          </header>

          {errorMsg && (
            <div className="mb-2 px-4 py-3 rounded-lg bg-rose-50 text-rose-600 text-sm ring-1 ring-rose-200">
              {errorMsg}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-6 md:px-8 pb-6 md:pb-8">
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              {viewMode === "table" ? (
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 w-10 text-left bg-gray-50/80">
                        <input
                          type="checkbox"
                          checked={allCurrentSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                        />
                      </th>
                      {col("id") && (
                        <th className="px-3 py-4 text-left font-medium bg-gray-50/80">
                          Product ID
                        </th>
                      )}
                      {col("name") && (
                        <th className="px-3 py-4 text-left font-medium bg-gray-50/80">
                          Name Product
                        </th>
                      )}
                      {col("category") && (
                        <th className="px-3 py-4 text-left font-medium bg-gray-50/80">
                          Category
                        </th>
                      )}
                      {col("stock") && (
                        <th className="px-3 py-4 text-left font-medium bg-gray-50/80">
                          Stock
                        </th>
                      )}
                      {col("price") && (
                        <th className="px-3 py-4 text-left font-medium bg-gray-50/80">
                          Total
                        </th>
                      )}
                      {col("status") && (
                        <th className="px-3 py-4 text-left font-medium bg-gray-50/80">
                          Status
                        </th>
                      )}
                      <th className="px-6 py-4 w-10 bg-gray-50/80" />
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {loading && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                          Yuklanmoqda...
                        </td>
                      </tr>
                    )}

                    {!loading && currentItems.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                          Mahsulotlar topilmadi
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      currentItems.map((p) => {
                        const status = deriveStatus(p.stock);
                        return (
                          <tr key={p.id} className="h-[68px] hover:bg-gray-50/60 transition">
                            <td className="px-6 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(p.id)}
                                onChange={() => toggleSelectOne(p.id)}
                                className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                              />
                            </td>
                            {col("id") && (
                              <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                                {formatId(p.id)}
                              </td>
                            )}
                            {col("name") && (
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3 min-w-[220px]">
                                  <img
                                    src={p.img?.[0] || "https://placehold.co/48x48?text=img"}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "https://placehold.co/48x48?text=img";
                                    }}
                                    className="w-9 h-9 rounded-md object-cover bg-gray-100 flex-shrink-0"
                                  />
                                  <span className="font-medium text-sm text-gray-800 truncate">
                                    {p.title}
                                  </span>
                                </div>
                              </td>
                            )}
                            {col("category") && (
                              <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                                {p.category || "—"}
                              </td>
                            )}
                            {col("stock") && (
                              <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                                {p.stock ?? 0}
                              </td>
                            )}
                            {col("price") && (
                              <td className="px-3 py-3 text-sm text-gray-700 whitespace-nowrap">
                                {formatPrice(p.price)}
                              </td>
                            )}
                            {col("status") && (
                              <td className="px-3 py-3 whitespace-nowrap">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses(
                                    status
                                  )}`}
                                >
                                  {status}
                                </span>
                              </td>
                            )}
                            <td className="px-3 py-3 text-right relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === p.id ? null : p.id);
                                }}
                                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                              >
                                <FaEllipsisV />
                              </button>

                              {openMenuId === p.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-6 top-12 z-20 w-44 bg-white rounded-xl shadow-lg ring-1 ring-gray-100 py-1.5 text-sm"
                                >
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(p)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-gray-50"
                                  >
                                    <FaEye className="text-gray-400" /> Product Detail
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(p)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-gray-50"
                                  >
                                    <FaPen className="text-gray-400" /> Edit Product
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => confirmDelete(p)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-500 hover:bg-rose-50"
                                  >
                                    <FaTrashAlt /> Delete Product
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {loading && (
                    <p className="col-span-full text-center text-gray-400 text-sm py-12">
                      Yuklanmoqda...
                    </p>
                  )}
                  {!loading && currentItems.length === 0 && (
                    <p className="col-span-full text-center text-gray-400 text-sm py-12">
                      Mahsulotlar topilmadi
                    </p>
                  )}
                  {!loading &&
                    currentItems.map((p) => {
                      const status = deriveStatus(p.stock);
                      return (
                        <div
                          key={p.id}
                          className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition relative"
                        >
                          <img
                            src={p.img?.[0] || "https://placehold.co/200x200?text=img"}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://placehold.co/200x200?text=img";
                            }}
                            className="w-full h-32 object-cover rounded-lg bg-gray-100 mb-3"
                          />
                          <p className="font-medium text-sm text-gray-800 truncate">{p.title}</p>
                          <p className="text-xs text-gray-400 mb-2">{formatId(p.id)}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">{formatPrice(p.price)}</span>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusClasses(status)}`}>
                              {status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              className="flex-1 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
                            >
                              <FaPen className="inline mr-1" /> Tahrirlash
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(p)}
                              className="flex-1 py-2 rounded-lg border border-rose-200 text-xs text-rose-500 hover:bg-rose-50"
                            >
                              <FaTrashAlt className="inline mr-1" /> O'chirish
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1.5 rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 ring-blue-500"
                >
                  {[5, 10, 12, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span>per page</span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>
                  {rangeStart}-{rangeEnd} of {filtered.length}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safePage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent text-gray-500"
                  >
                    <FaChevronLeft size={12} />
                  </button>

                  {Array.from({ length: totalPages })
                    .slice(0, 5)
                    .map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                            safePage === pageNum
                              ? "bg-gray-900 text-white"
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent text-gray-500"
                  >
                    <FaChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={closeModal}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-gray-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <input
                className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 ring-blue-500"
                placeholder="Nomi"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 ring-blue-500"
                  type="number"
                  placeholder="Narxi"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                />
                <input
                  className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 ring-blue-500"
                  type="number"
                  placeholder="Qoldiq (stock)"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: Number(e.target.value) })
                  }
                />
              </div>

              <input
                className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 ring-blue-500"
                placeholder="Kategoriya"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />

              <input
                className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 ring-blue-500"
                placeholder="Rasm URL"
                value={formData.img}
                onChange={(e) => setFormData({ ...formData, img: e.target.value })}
              />
              <textarea
                className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 ring-blue-500 h-24"
                placeholder="Tavsif"
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition"
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-gray-100 text-center"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 flex items-center justify-center mb-5">
              <FaTrashAlt className="text-rose-500 text-xl" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Mahsulotni o&apos;chirish
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              <span className="font-medium text-gray-700">{deleteTarget.title}</span>{" "}
              mahsulotini rostdan ham o&apos;chirmoqchimisiz? Bu amalni qaytarib
              bo&apos;lmaydi.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="py-3.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                Orqaga
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="py-3.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-medium transition"
              >
                {deleting ? "O'chirilmoqda..." : "O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}