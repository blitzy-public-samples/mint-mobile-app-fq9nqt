// Human Tasks:
// 1. Configure environment variables for security settings (CORS domains, CSP policies)
// 2. Set up SSL certificates and HTTPS configuration
// 3. Configure rate limiting thresholds based on environment
// 4. Set up monitoring alerts for security events
// 5. Configure API documentation access controls

// Third-party imports with versions
import { NestFactory } from '@nestjs/core'; // ^9.0.0
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // ^6.0.0
import { ConfigService } from '@nestjs/config'; // ^9.0.0
import * as helmet from 'helmet'; // ^6.0.0
import * as compression from 'compression'; // ^1.7.4

// Internal imports
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from './common/pipes/validation.pipe';

/**
 * Bootstrap function to initialize and configure the NestJS application
 * 
 * Requirements addressed:
 * - System Architecture (Technical Specification/5.1 High-Level Architecture Overview)
 *   Implements backend service initialization with proper middleware setup
 * 
 * - Security Architecture (Technical Specification/5.4 Security Architecture)
 *   Configures comprehensive security headers and CORS policies
 * 
 * - API Design (Technical Specification/8.3 API Design)
 *   Sets up OpenAPI documentation and request validation
 */
async function bootstrap(): Promise<void> {
  // Create NestJS application instance
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'], // Configure logging levels
    cors: false // Disable default CORS to use custom configuration
  });

  // Get configuration service
  const configService = app.get(ConfigService);

  // Configure CORS with secure settings
  app.enableCors({
    origin: ['https://*.mintreplica.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600 // Cache preflight requests for 1 hour
  });

  // Configure Helmet security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://*.mintreplica.com'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: true,
    dnsPrefetchControl: true,
    frameguard: true,
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: true,
    xssFilter: true
  }));

  // Enable response compression
  app.use(compression({
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // Configure global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip unknown properties
    forbidNonWhitelisted: true, // Throw error on unknown properties
    transform: true, // Auto-transform payloads to DTO instances
    disableErrorMessages: process.env.NODE_ENV === 'production',
    validationError: {
      target: false,
      value: false
    }
  }));

  // Configure global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configure Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Mint Replica Lite API')
    .setDescription('RESTful API documentation for Mint Replica Lite financial management system')
    .setVersion('1.0')
    .addTag('Authentication')
    .addTag('Accounts')
    .addTag('Transactions')
    .addTag('Budgets')
    .addTag('Goals')
    .addTag('Investments')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha'
    }
  });

  // Get port from configuration with fallback
  const port = configService.get<number>('PORT', 3000);

  // Start application
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API documentation available at: http://localhost:${port}/api/docs`);
}

// Start application
bootstrap().catch(err => {
  console.error('Application failed to start:', err);
  process.exit(1);
});