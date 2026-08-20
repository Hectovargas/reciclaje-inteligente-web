import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { WalletEncryptionService } from '../blockchain/wallet-encryption.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private walletEncryptionService: WalletEncryptionService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, encryptedPrivateKey, iv, authTag, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const custodialWallet = this.walletEncryptionService.generateCustodialWallet();

    const createdUser = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        role: Role.USER,
        walletAddress: custodialWallet.address,
        encryptedPrivateKey: custodialWallet.encryptedPrivateKey,
        iv: custodialWallet.iv,
        authTag: custodialWallet.authTag,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const payload = { email: createdUser.email, sub: createdUser.id, role: createdUser.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: createdUser,
    };
  }
}
