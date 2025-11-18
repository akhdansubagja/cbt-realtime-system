// frontend/src/lib/swal.ts
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Konfigurasi standar untuk konfirmasi hapus
export const confirmDelete = async (
  title = 'Apakah Anda yakin?',
  text = 'Data yang dihapus tidak dapat dikembalikan!',
  confirmButtonText = 'Ya, Hapus!'
) => {
  return MySwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: 'rgba(216, 80, 80, 1)', // Merah untuk bahaya
    cancelButtonColor: '#3085d6', // Biru untuk batal
    confirmButtonText,
    cancelButtonText: 'Batal',
    reverseButtons: true, // Posisi tombol dibalik agar tombol "Batal" di kiri (opsional)
  });
};

// Konfigurasi untuk notifikasi sukses sederhana (jika tidak ingin pakai Mantine notifications)
export const showSuccessAlert = (title: string, text?: string) => {
  return MySwal.fire({
    title,
    text,
    icon: 'success',
    timer: 1500,
    showConfirmButton: false,
  });
};

export default MySwal;