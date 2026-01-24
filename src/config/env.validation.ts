import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // ===== NODE ENVIRONMENT =====
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().min(1).max(65535).default(3000),

  // ===== DATABASE =====
  DB_HOST: Joi.string().required().description('Database host'),

  DB_PORT: Joi.number().port().default(3306),

  DB_USERNAME: Joi.string().required().description('Database username'),

  DB_PASSWORD: Joi.string()
    .allow('')
    .default('')
    .description('Database password'),

  DB_NAME: Joi.string().required().description('Database name'),

  // ===== JWT =====
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT secret key (minimum 32 characters)'),

  JWT_EXPIRES_IN: Joi.string()
    .default('24h')
    .description('JWT expiration time'),

  // ===== EMAIL =====
  EMAIL_HOST: Joi.string().required().description('SMTP host'),

  EMAIL_PORT: Joi.number().port().default(587),

  EMAIL_SECURE: Joi.string().valid('true', 'false').default('false'),

  EMAIL_USER: Joi.string()
    .email()
    .required()
    .description('SMTP username (email)'),

  EMAIL_PASS: Joi.string().required().description('SMTP password'),

  // ===== FRONTEND =====
  FRONTEND_URL: Joi.string()
    .uri()
    .required()
    .description('Frontend URL for CORS'),

  // ===== THROTTLE =====
  THROTTLE_TTL: Joi.number()
    .integer()
    .min(1000)
    .default(60000)
    .description('Throttle time-to-live in milliseconds'),

  THROTTLE_LIMIT: Joi.number()
    .integer()
    .min(1)
    .default(100)
    .description('Throttle request limit'),

  // ===== CACHE =====
  CACHE_TTL: Joi.number()
    .integer()
    .min(1)
    .default(300)
    .description('Cache time-to-live in seconds'),

  CACHE_MAX: Joi.number()
    .integer()
    .min(1)
    .default(100)
    .description('Maximum cache items'),
});
