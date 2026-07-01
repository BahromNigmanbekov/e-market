import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GET_PRODUCT_API,
  headers: {
    "Content-Type": "application/json",
  },
});

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return axiosError.response?.data?.message || axiosError.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export const productService = {
  getAll: async () => {
    try {
      const response = await api.get("/");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Mahsulotlarni olishda xatolik"));
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Mahsulotni olishda xatolik"));
    }
  },

  create: async (data: any) => {
    try {
      const response = await api.post("/", data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Mahsulot qo'shishda xatolik"));
    }
  },

  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Mahsulotni tahrirlashda xatolik"));
    }
  },

  remove: async (id: string) => {
    try {
      const response = await api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Mahsulotni o'chirishda xatolik"));
    }
  },
};

export default api;