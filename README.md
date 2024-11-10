# Mint Replica Lite

<!-- Human Tasks
1. Configure AWS credentials and access keys for deployment
2. Set up development environment security certificates
3. Configure Plaid API integration keys
4. Set up monitoring and alerting thresholds
5. Configure email service for notifications
6. Set up database backup schedules
7. Configure SSL certificates for domains
-->

[![Build Status](https://github.com/mintreplicalite/backend/actions/workflows/backend.yml/badge.svg)](https://github.com/mintreplicalite/backend/actions/workflows/backend.yml)
[![Test Coverage](https://codecov.io/gh/mintreplicalite/test/branch/main/graph/badge.svg)](https://codecov.io/gh/mintreplicalite/test)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A comprehensive mobile-first personal financial management system with native mobile apps, RESTful backend, and real-time services.

## Features

- 🔒 Secure user authentication with multi-factor support
- 🏦 Financial institution integration via Plaid
- 💳 Real-time transaction tracking and categorization
- 📊 Budget management with alerts and tracking
- 📈 Investment portfolio tracking and analysis
- 🎯 Goal setting with progress monitoring
- 🔔 Real-time notifications and alerts

## Architecture

Mint Replica Lite is built with a modern, scalable architecture:

- Native mobile apps (iOS/Android) with offline support
- RESTful backend API with NestJS
- PostgreSQL database with Redis caching
- Real-time notification system with WebSockets
- Analytics engine for financial insights

## Technology Stack

### Mobile
- iOS: Swift 5.5+, SwiftUI
- Android: Kotlin 1.5+, Jetpack Compose

### Backend
- Runtime: Node.js 16+
- Framework: NestJS 9.0+
- Database: PostgreSQL 14+
- Cache: Redis 6+

### Infrastructure
- Cloud: AWS
- Container: Kubernetes 1.24+
- CI/CD: GitHub Actions

## Getting Started

### Prerequisites

1. Development Tools:
   - Node.js 16+
   - TypeScript 4.8+
   - Docker 20.10+
   - Kubernetes 1.24+
   - AWS CLI 2.0+

2. Mobile Development:
   - Xcode 14+ (for iOS)
   - Android Studio Electric Eel+ (for Android)
   - CocoaPods 1.11+
   - Gradle 7.5+

3. Database Tools:
   - PostgreSQL 14+
   - Redis 6+

### Development Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/mintreplicalite/mintreplicalite.git
cd mintreplicalite
```

2. Install dependencies:
```bash
# Backend dependencies
cd src/backend
npm install

# Web dependencies
cd ../web
npm install

# iOS dependencies
cd ../ios
pod install

# Android dependencies
cd ../android
./gradlew build
```

3. Configure environment variables:
```bash
# Backend
cp src/backend/.env.example src/backend/.env

# Web
cp src/web/.env.example src/web/.env
```

4. Start development servers:
```bash
# Backend API
cd src/backend
npm run start:dev

# Web application
cd src/web
npm run dev

# iOS application (using Xcode)
open src/ios/MintReplicaLite.xcworkspace

# Android application (using Android Studio)
open -a "Android Studio" src/android
```

### Building for Production

1. Backend build:
```bash
cd src/backend
npm run build
docker build -t mintreplicalite-api .
```

2. Web build:
```bash
cd src/web
npm run build
docker build -t mintreplicalite-web .
```

3. Mobile builds:
```bash
# iOS
cd src/ios
fastlane build

# Android
cd src/android
./gradlew assembleRelease
```

## Documentation

- [API Documentation](src/backend/docs/api.md)
- [Architecture Guide](src/backend/docs/architecture.md)
- [Development Guide](src/backend/docs/development.md)
- [Deployment Guide](src/backend/docs/deployment.md)

## Testing

```bash
# Backend tests
cd src/backend
npm run test
npm run test:e2e

# Web tests
cd src/web
npm run test

# iOS tests
cd src/ios
fastlane test

# Android tests
cd src/android
./gradlew test
```

## Security

For security-related matters, please review our [Security Policy](SECURITY.md).

Key security features:
- End-to-end encryption for sensitive data
- Multi-factor authentication support
- Regular security audits and penetration testing
- Compliance with financial data regulations
- Automated security scanning in CI/CD pipeline

## Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and development process.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Open an issue in the GitHub repository
- Contact the development team at support@mintreplicalite.com
- Join our developer community on Discord

## Acknowledgments

- [Plaid](https://plaid.com) for financial data integration
- [NestJS](https://nestjs.com) for the backend framework
- The open-source community for various tools and libraries

---
Built with ❤️ by the Mint Replica Lite team