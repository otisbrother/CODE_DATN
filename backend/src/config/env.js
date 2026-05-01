require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'elearning_ai',
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'E-Learning AI <noreply@elearning.com>',
  ADMIN_BANK_NAME: process.env.ADMIN_BANK_NAME || 'MB',
  ADMIN_BANK_BIN: process.env.ADMIN_BANK_BIN || '970422',
  ADMIN_BANK_ACCOUNT_NO: process.env.ADMIN_BANK_ACCOUNT_NO || '0395256163',
  ADMIN_BANK_ACCOUNT_NAME: process.env.ADMIN_BANK_ACCOUNT_NAME || 'NGUYEN HUY TOA',
  BANK_WEBHOOK_SECRET: process.env.BANK_WEBHOOK_SECRET || '',
};
