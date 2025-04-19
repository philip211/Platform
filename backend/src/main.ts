import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger';

async function bootstrap() {
  const logger = new AppLogger('Bootstrap');
  
  validateEnvironment(logger);
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: new AppLogger(),
    });
    
    app.enableCors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || 
              [process.env.FRONTEND_URL || 'http://localhost:5173'],
      credentials: true,
    });
    
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));
    
    app.setGlobalPrefix('api');
    
    const port = process.env.PORT || 3000;
    await app.listen(port);
    
    logger.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`, error.stack);
    process.exit(1);
  }
}

/**
 * Validates required environment variables
 */
function validateEnvironment(logger: AppLogger): void {
  const requiredVars = [
    'DATABASE_URL',
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    logger.error('Please check your .env file and make sure all required variables are set.');
    process.exit(1);
  }
  
  logger.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);
}

bootstrap();
