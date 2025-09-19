const dotenv = await import('dotenv');
dotenv.config();

import express from 'express';
import { handleError } from './src/config/errorHandler.js';
import pageRoutes from './src/routes/pages.js';
import apiRoutes from './src/routes/api.js';

const PORT = process.env.PORT || 8888;

const app = express();

// Content Security Policy middleware for PayPal integration
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://www.paypal.com https://sandbox.paypal.com https://*.paypal.com https://*.paypalobjects.com; " +
      "connect-src 'self' https://sandbox.paypal.com https://*.paypal.com https://api.sandbox.paypal.com https://api.paypal.com; " +
      'frame-src https://sandbox.paypal.com https://*.paypal.com https://*.paypalobjects.com; ' +
      "img-src 'self' data: https://*.paypal.com https://*.paypalobjects.com; " +
      "style-src 'self' 'unsafe-inline' https://*.paypal.com; " +
      "font-src 'self' https://*.paypal.com;"
  );
  next();
});

// Express configuration
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

// Routes
app.use('/', pageRoutes);
app.use('/api', apiRoutes);

// Error handling middleware (must be last)
app.use(handleError);

// Start server
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}/`);
});

export default app;
