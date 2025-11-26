import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin as string | undefined;
    const adminWhiteList = this.configService.get('frontend-monitor.adminWhiteList');

    if (origin && adminWhiteList?.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-credentials', 'true');
    }
    next();
  }
}