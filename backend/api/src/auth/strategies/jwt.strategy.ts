import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // --- PERBAIKAN DI SINI ---
      // Provide a default value to ensure it's never undefined.
      // The actual secret should ALWAYS come from your .env file.
      secretOrKey: configService.get<string>('JWT_SECRET', 'fallback-secret-key'),
    });
  }

  async validate(payload: any) {
    // The payload is the decoded JWT content.
    // Whatever we return here will be attached to the request object as req.user
    return payload;
  }
}