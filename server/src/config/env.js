const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Throw error if JWT_SECRET is the default in production
if (NODE_ENV === 'production' && JWT_SECRET === 'dev-secret-change-in-production') {
  throw new Error('JWT_SECRET must be set to a secure value in production. Set the JWT_SECRET environment variable.');
}

module.exports = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET,
  NODE_ENV,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || '',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:5173',
  AT_API_KEY: process.env.AT_API_KEY || '',
  AT_USERNAME: process.env.AT_USERNAME || 'sandbox',
  AT_USSD_SERVICE_CODE: process.env.AT_USSD_SERVICE_CODE || '',
};
