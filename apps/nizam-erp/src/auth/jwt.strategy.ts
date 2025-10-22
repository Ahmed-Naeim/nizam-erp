import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "./auth.service";


//Define the shape of the JWT payload
export interface JwtPayload {
  sub: string; //User ID
  email: string;
  tenantId: string; //Tenant ID
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    // We inject AuthService to (optionally) find the user in the DB
    // This is a good practice to ensure the user still exists
    private readonly authService: AuthService,
  ){
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * @method validate
   * @param payload
   * @returns
   * @desc This method is called by passport after it verifies the JWT signature. It returns the payload which is then attached to request.user.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // we could add a check here to see if user (payload.sub) still exists**********
    // For now, we'll trust the payload as it's signed.
    if (!payload.tenantId) {
      throw new UnauthorizedException('Invalid token: No tenant ID');
    }

    // This return value becomes 'request.user' in our controllers
    return {
      sub: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId
    };
  }
}
