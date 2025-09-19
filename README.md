# Simple PayPal Checkout Demo

A clean, simplified PayPal checkout implementation featuring PayPal buttons, Apple Pay, and card payments.

## Features

- **PayPal Smart Buttons** - PayPal, Venmo, Pay Later
- **Apple Pay Integration** - Native Apple Pay for supported devices
- **Card Payments** - Direct credit/debit card processing
- **Pay Later Messaging** - Promotional messaging for eligible amounts
- **Responsive Design** - Works on desktop and mobile
- **Production Ready** - Includes domain verification for Apple Pay

## Quick Start

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd PP-Simple
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory:

   ```properties
   CLIENT_ID=your_paypal_sandbox_client_id
   CLIENT_SECRET=your_paypal_sandbox_client_secret
   BASE_URL=http://localhost:8888
   ```

3. **Run Locally**

   ```bash
   npm run dev    # Development with nodemon
   npm start      # Production mode
   ```

4. **Visit** `http://localhost:8888`

## Payment Methods

### PayPal Smart Buttons

- PayPal account payments
- Venmo (US customers)
- Pay Later options
- Guest checkout

### Apple Pay

- Automatic device detection
- Native Apple Pay interface
- Touch ID / Face ID authentication
- Only appears on compatible Apple devices

### Card Payments

- Direct credit/debit card processing
- Real-time validation
- Secure tokenization through PayPal

## Testing

### Apple Pay Testing

Apple Pay requires:

- Apple device (iPhone, iPad, Mac with Touch ID/Face ID)
- Safari browser
- Apple Pay configured in Wallet app
- HTTPS in production (localhost works for development)

### Test Cards

Use PayPal's sandbox test cards for card payment testing.

## Deployment

### Environment Variables (Production)

```properties
CLIENT_ID=your_live_paypal_client_id
CLIENT_SECRET=your_live_paypal_client_secret
BASE_URL=https://your-domain.com
```

### Apple Pay Domain Verification

For production, Apple Pay requires domain verification:

1. Enable Apple Pay in PayPal Developer Dashboard
2. Add your domain to Apple Pay settings
3. Upload domain verification file (handled automatically by this app)

## Project Structure

```
├── app.js                          # Main application entry
├── public/
│   ├── checkout.js                 # Frontend PayPal integration
│   ├── styles/custom.css          # Styling
│   └── apple-developer-merchantid-domain-association  # Apple Pay domain verification
├── src/
│   ├── controllers/
│   │   └── pageController.js      # Route handlers
│   ├── routes/
│   │   ├── api.js                 # API routes
│   │   └── pages.js               # Page routes (includes /.well-known route)
│   ├── services/
│   │   ├── authApi.js             # PayPal authentication
│   │   └── ordersApi.js           # PayPal Orders API
│   └── config/
│       └── errorHandler.js        # Error handling
├── views/
│   └── checkout.ejs               # Checkout page template
├── APPLE_PAY_INTEGRATION.md       # Apple Pay implementation guide
└── README.md                      # This file
```

## Architecture

### Frontend (checkout.js)

- PayPal SDK integration
- Apple Pay session management
- Card field initialization
- Payment flow handling

### Backend (Node.js/Express)

- PayPal Orders API integration
- Authentication token management
- Apple Pay domain verification
- Error handling and logging

## Documentation

- [Apple Pay Integration Guide](./APPLE_PAY_INTEGRATION.md) - Step-by-step implementation
- [PayPal Developer Docs](https://developer.paypal.com/) - Official PayPal documentation

## Support

This implementation supports:

- PayPal Sandbox and Live environments
- Apple Pay in supported regions
- Card payments via PayPal's secure processing
- Mobile and desktop browsers

## License

MIT License - feel free to use this as a starting point for your PayPal integration.
