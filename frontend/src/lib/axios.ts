import axios from "axios";

/**
 * Instance Axios global untuk aplikasi.
 * Sudah dikonfigurasi dengan Base URL dari environment variable.
 */
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

/**
 * Interceptor Request.
 * Menangani penyisipan token otorisasi secara otomatis berdasarkan endpoint.
 * - Endpoint publik: Tidak ada token.
 * - Endpoint /admin: Token 'access_token' (Admin).
 * - Endpoint /participants: Token 'participant_token_{id}' (Peserta Ujian).
 */
api.interceptors.request.use(
  (config) => {
    // Daftar endpoint publik yang TIDAK memerlukan token sama sekali
    const publicPaths = [
      "/participants/join",
      "/examinees/all/simple",
      "/auth/login",
    ];

    // Jika URL adalah salah satu dari publicPaths, JANGAN kirim token apa pun
    if (publicPaths.some((path) => config.url?.includes(path))) {
      delete config.headers.Authorization;
      return config;
    }

    let token: string | null = null;

    // Logika untuk rute ADMIN
    if (config.url?.includes("/admin")) {
      token = localStorage.getItem("access_token");
    }
    // Logika untuk rute PESERTA
    else if (config.url?.includes("/participants/")) {
      // Ekstrak ID dari URL, contoh: '/participants/39/start' -> '39'
      const match = config.url.match(/\/participants\/(\d+)/);

      if (match && match[1]) {
        const participantId = match[1];
        // Cari token yang TEPAT dan SPESIFIK untuk ID tersebut
        token = sessionStorage.getItem(`participant_token_${participantId}`);
      }
    }

    // Hapus header otorisasi lama untuk memastikan kebersihan
    delete config.headers.Authorization;

    // Jika token yang relevan ditemukan, baru lampirkan ke header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
