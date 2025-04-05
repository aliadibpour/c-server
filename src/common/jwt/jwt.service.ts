import { Injectable } from "@nestjs/common"

@Injectable()
export class JwtService {
  constructor(private readonly jwtService: JwtService) {}

  async createToken(payload: any) {
    return this.jwtService.signAsync(payload)
  }

  async verifyToken(token: string) {
    return this.jwtService.verifyAsync(token)
  }
}
