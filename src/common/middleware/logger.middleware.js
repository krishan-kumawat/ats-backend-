import { Injectable, Logger } from '@nestjs/common';


@Injectable()
export class LoggerMiddleware {
  logger = new Logger('HTTP');


  use(req, res, next) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '-';
    const start = Date.now();


    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const userId = req.user?.sub || 'anonymous';


      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${duration}ms - user:${userId} - ${ip} - ${userAgent}`
      );
    });


    next();
  }
}



