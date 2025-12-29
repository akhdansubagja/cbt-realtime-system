/**
 * Data Transfer Object (DTO) untuk login.
 * Membawa informasi username dan password dari klien.
 */
export class LoginDto {
  /** Username pengguna */
  username: string;

  /** Password pengguna (plaintext) */
  password: string;
}
