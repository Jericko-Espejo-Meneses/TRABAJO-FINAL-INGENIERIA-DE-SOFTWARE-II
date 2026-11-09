import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('====================================================');
      this.logger.log('🚀 Conexión establecida con éxito a PostgreSQL (Supabase) mediante Prisma');
      this.logger.log('📦 Base de datos activa: PostgreSQL');
      this.logger.log('====================================================');
    } catch (error: any) {
      this.isConnected = false;
      this.logger.warn('====================================================');
      this.logger.warn('⚠️ AVISO: No se pudo conectar a PostgreSQL en: ' + process.env.DATABASE_URL);
      this.logger.warn('🛡️ El backend continúa operando de forma resiliente con el almacén en memoria.');
      this.logger.warn('====================================================');
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
      this.logger.log('Desconectado limpiamente de PostgreSQL');
    }
  }

  public get connected(): boolean {
    return this.isConnected;
  }
}
