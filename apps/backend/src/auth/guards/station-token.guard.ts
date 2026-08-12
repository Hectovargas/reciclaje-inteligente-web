import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StationTokenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-station-token'];

    if (!token) {
      throw new UnauthorizedException('Missing X-Station-Token header');
    }

    const station = await this.prisma.station.findUnique({
      where: { token: token as string },
    });

    if (!station) {
      throw new UnauthorizedException('Invalid Station Token');
    }

    // Attach station to request object if needed later
    request.station = station;

    return true;
  }
}
