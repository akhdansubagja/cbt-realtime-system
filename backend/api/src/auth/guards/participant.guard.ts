import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ParticipantGuard extends AuthGuard('jwt') implements CanActivate {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      // Jika tidak ada user/token (AuthGuard gagal), kirim 401 Unauthorized
      throw err || new UnauthorizedException('Akses ditolak: Token otentikasi tidak valid atau tidak ada.');
    }

    const request = context.switchToHttp().getRequest();
    const paramId = parseInt(request.params.id, 10);
    
    // Validasi utama: pastikan participantId di dalam token SAMA DENGAN id di URL
    if (user.participantId !== paramId) {
      throw new ForbiddenException('Akses ditolak: Anda tidak memiliki izin untuk sesi ini.');
    }
    
    return user; // Jika lolos, lanjutkan
  }
}