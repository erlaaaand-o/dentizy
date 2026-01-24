<div align="center">

  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />

  <h1>Dentizy Backend API</h1>

  <p>
    A robust and scalable backend API built with <strong>NestJS</strong> for the Dentizy dental management platform.<br>
    Designed for security, efficiency, and maintainability.
  </p>

  <p>
    <a href="https://nestjs.com"><img src="https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://www.mysql.com/"><img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" /></a>
    <a href="https://jwt.io/"><img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT" /></a>
    <a href="https://typeorm.io/"><img src="https://img.shields.io/badge/TypeORM-FE0626?style=flat-square&logo=typeorm&logoColor=white" alt="TypeORM" /></a>
  </p>

</div>

<br />

## Table of Contents

- [About](#about)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Security Implementation](#security-implementation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Developer & Contact](#developer--contact)

---

## About

**Dentizy Backend** is a comprehensive RESTful API engineered with the NestJS framework. It serves as the backbone for dental clinic management systems, providing secure authentication, efficient patient data management, and a scalable architecture that adheres to industry-standard best practices.

---

## Key Features

The application is built with a focus on modularity and performance.

- **Authentication & Authorization**: Secure JWT token-based system with granular Role-Based Access Control (RBAC).
- **User Management**: Complete lifecycle management for clinic staff and administrators.
- **Communication**: Integrated Email Service using Nodemailer for automated notifications.
- **Data Persistence**: TypeORM implementation with MySQL for reliable relational data storage.
- **Advanced Security**:
  - Helmet for HTTP header security.
  - CSRF protection and Rate Limiting (Throttler).
  - Bcrypt password hashing.
- **Documentation**: Auto-generated, interactive Swagger/OpenAPI documentation.
- **Performance**: Redis-ready caching mechanism and Event-driven architecture.
- **Automation**: Task scheduling via Cron jobs.
- **Quality Assurance**: Comprehensive Unit and E2E testing suites using Jest.

---

## Tech Stack

| Technology       | Purpose                                           |
| :--------------- | :------------------------------------------------ |
| **NestJS**       | Progressive Node.js framework for backend logic   |
| **TypeScript**   | Strongly typed superset of JavaScript             |
| **TypeORM**      | Object-Relational Mapper for database interaction |
| **MySQL**        | Primary relational database management system     |
| **Passport JWT** | Authentication strategy middleware                |
| **Swagger**      | API documentation and interface testing           |
| **Jest**         | Testing framework for Unit and E2E tests          |
| **Nodemailer**   | Module for sending e-mails                        |
| **Helmet**       | Middleware for securing HTTP headers              |

---

## Prerequisites

Ensure your development environment meets the following requirements:

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MySQL**: v8.x or higher
- **Git**: Latest version

---

## Installation

Follow these steps to set up the development environment:

1.  **Clone the Repository**

    ```bash
    git clone <repository-url>
    cd backend
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Database Setup**

    Execute the following SQL command to create the database:

    ```sql
    CREATE DATABASE dentizy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ```

---

## Configuration

<details>
<summary><strong>Click to view Environment Variables Setup</strong></summary>
<br>

1.  Duplicate the example environment file:

    ```bash
    cp .env.example .env
    ```

2.  Configure your `.env` file:

    ```env
    # Node Configuration
    NODE_ENV=development
    PORT=3000

    # Database Configuration
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_USERNAME=root
    DB_PASSWORD=your_password
    DB_NAME=dentizy_db

    # JWT Configuration
    JWT_SECRET=your_super_secret_key
    JWT_EXPIRES_IN=24h

    # Email Configuration
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_SECURE=false
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_app_password

    # Frontend URL
    FRONTEND_URL=http://localhost:3001
    ```

</details>

<details>
<summary><strong>Click to view Helper Scripts</strong></summary>
<br>

**Generate a secure JWT Secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Gmail Configuration:**

For Gmail, you need to generate an **App Password**:

1. Enable 2-Factor Authentication on your Google Account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password
4. Use this password in `EMAIL_PASS`

</details>

---

## Running the Application

### Development Mode

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

---

## Testing

### Run Unit Tests

```bash
npm run test
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

### Watch Mode

```bash
npm run test:watch
```

---

## API Documentation

Once the application is running, access the interactive API documentation:

**Swagger UI:** `http://localhost:3000/api`

The Swagger documentation provides:

- All available endpoints
- Request/Response schemas
- Interactive API testing
- Authentication requirements

---

## Security Implementation

This application implements multiple security layers:

### Security Features

- **Helmet** - Sets secure HTTP headers
- **CSRF Protection** - Prevents Cross-Site Request Forgery
- **Rate Limiting** - Prevents brute force attacks
- **Password Hashing** - Bcrypt with salt rounds
- **JWT Tokens** - Secure stateless authentication
- **Input Validation** - Request data sanitization
- **CORS** - Configurable Cross-Origin Resource Sharing

### Best Practices

1. **Never commit `.env` file** - Keep secrets safe
2. **Use strong JWT secrets** - Generate cryptographically secure keys
3. **Enable HTTPS in production** - Encrypt data in transit
4. **Regular dependency updates** - Keep packages up to date
5. **SQL Injection Prevention** - TypeORM parameterized queries

---

## Deployment

### Using NestJS Mau (AWS)

```bash
npm install -g @nestjs/mau
mau deploy
```

### Manual Deployment

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Set environment variables** for production

3. **Run database migrations** (if applicable)

4. **Start the application:**
   ```bash
   npm run start:prod
   ```

### Environment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Configure email service
- [ ] Set up monitoring
- [ ] Configure logging

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation as needed
- Use ESLint and Prettier for code formatting

```bash
# Format code
npm run format

# Lint code
npm run lint
```

---

## Developer & Contact

<div align="center">
  <img src="https://img.shields.io/badge/Developer-Erland%20Agsya%20Agustian-blue?style=for-the-badge" alt="Developer" />
</div>

<br>

**Erland Agsya Agustian**

- Email: [erlandagsya458@gmail.com](mailto:erlandagsya458@gmail.com)
- Instagram: [@erlaaaand\_](https://instagram.com/erlaaaand_)
- LinkedIn: [Connect with me](https://www.linkedin.com/in/erland-agsya-6619892a1)

### Get in Touch

Feel free to reach out for:

- Bug reports
- Feature requests
- Collaboration opportunities
- General inquiries

---

## Acknowledgments

- [NestJS](https://nestjs.com/) - The progressive Node.js framework
- [TypeORM](https://typeorm.io/) - Amazing ORM for TypeScript
- [Passport](http://www.passportjs.org/) - Authentication middleware
- All the amazing open-source contributors

---

## Support

If you encounter any issues or have questions:

1. Check the [API Documentation](http://localhost:3000/api)
2. Review this README
3. Open an [Issue](https://github.com/your-repo/issues)
4. Contact the [Developer](#developer--contact)

---

<div align="center">
  <p>Developed by <strong>Erland Agsya Agustian</strong></p>
  <p><strong>Star this repository if you find it helpful!</strong></p>
</div>
