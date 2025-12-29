import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Memvalidasi kredensial pengguna.
   * Mencari pengguna berdasarkan username dan membandingkan password yang diberikan.
   *
   * @param username Username pengguna.
   * @param pass Password yang akan divalidasi (plaintext).
   * @returns Objek user tanpa password jika valid, atau null jika tidak valid.
   */
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    // Membandingkan password yang diberikan dengan hash password di database
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user; // Hapus password dari hasil return
      return result;
    }
    return null; // Return null jika autentikasi gagal
  }

  /**
   * Membuat token JWT akses untuk pengguna yang berhasil login.
   *
   * @param user Objek user yang berhasil divalidasi.
   * @returns Objek yang berisi properti `access_token`.
   */
  async login(user: User) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Membuat token JWT khusus untuk sesi pengerjaan peserta ujian.
   * Token ini memiliki masa berlaku sesuai dengan durasi ujian ditambah buffer waktu.
   *
   * @param participant Objek participant yang berisi id, examinee, dan exam.
   * @returns Objek yang berisi `access_token` untuk sesi ujian tersebut.
   */
  async loginParticipant(participant: any) {
    const payload = {
      participantId: participant.id,
      examineeId: participant.examinee.id,
      examId: participant.exam.id,
    };
    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: `${participant.exam.duration_minutes + 15}m`,
      }),
    };
  }
}
