import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8444,http://localhost:3000')
    .split(',')
    .map((s) => s.trim());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Org-Id'],
  });

  // Serve the built web app from the same origin, so one URL hosts both the
  // SPA and the API (/api/*). Enabled when WEB_DIST_DIR points to apps/web/dist.
  const webDir = process.env.WEB_DIST_DIR;
  if (webDir) {
    const server = app.getHttpAdapter().getInstance();
    server.use(express.static(webDir));
    // SPA fallback for client-side routes — everything except /api/*.
    server.get(/^(?!\/api).*/, (_req: any, res: any) => res.sendFile(join(webDir, 'index.html')));
    Logger.log(`Serving web app from ${webDir}`, 'Bootstrap');
  }

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  Logger.log(`SupplyMind API listening on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
