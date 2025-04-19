// src/app.module.ts
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { UserModule } from './user/user.module'
import { MafiaModule } from './modules/mafia/mafia.module'
import { HealthModule } from './health/health.module'

@Module({
  imports: [
    PrismaModule,
    UserModule,
    MafiaModule, // Добавляем модуль Мафии
    HealthModule, // Добавляем модуль Health для проверки работоспособности
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
