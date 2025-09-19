// Simple PayPal Checkout Implementation

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function () {
  loadPayPalSDK();

  // Update total when amount changes
  document
    .getElementById('amount-input')
    .addEventListener('input', function () {
      updateTotal();
    });
});

// Update the total display
function updateTotal() {
  const amount = document.getElementById('amount-input').value || '10.00';
  document.getElementById('total-amount').textContent = amount;
}

// Load PayPal SDK and initialize components
function loadPayPalSDK() {
  // Enable card fields by removing card from disable-funding
  const scriptUrl = `https://www.paypal.com/sdk/js?components=buttons,card-fields,messages,applepay&intent=capture&client-id=${clientId}&enable-funding=venmo,paylater,applepay&currency=USD`;

  const scriptElement = document.createElement('script');
  scriptElement.src = scriptUrl;
  scriptElement.onload = initializePayPal;
  scriptElement.onerror = () => console.error('Failed to load PayPal SDK');

  document.head.appendChild(scriptElement);
}

// Initialize PayPal components after SDK loads
function initializePayPal() {
  // Initialize PayPal Buttons
  paypal
    .Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal',
      },
      createOrder: createOrder,
      onApprove: onApprove,
      onCancel: onCancel,
      onError: onError,
    })
    .render('#paypal-button-container');

  // Hide Apple Pay section by default
  const applePaySection = document.getElementById('applepay-section');
  if (applePaySection) {
    applePaySection.style.display = 'none';
  }

  // Initialize Apple Pay (if supported)
  if (
    paypal.Applepay &&
    window.ApplePaySession &&
    ApplePaySession.canMakePayments()
  ) {
    initializeApplePay();
  }

  // Initialize PayLater Messages
  if (paypal.Messages) {
    paypal
      .Messages({
        amount: document.getElementById('amount-input').value || '10.00',
        placement: 'payment',
        style: {
          layout: 'text',
          logo: {
            type: 'inline',
          },
        },
      })
      .render('#paylater-message-container');
  }

  // Initialize Card Fields
  const cardField = paypal.CardFields({
    createOrder: createOrder,
    onApprove: onApprove,
    onError: onError,
  });

  if (cardField.isEligible()) {
    cardField.NumberField().render('#card-number-field');
    cardField.ExpiryField().render('#card-expiry-field');
    cardField.CVVField().render('#card-cvv-field');

    document
      .getElementById('card-submit-button')
      .addEventListener('click', () => {
        cardField.submit();
      });
  } else {
    document.getElementById('card-section').style.display = 'none';
  }
}

// Add Apple Pay initialization function
function initializeApplePay() {
  try {
    if (!window.ApplePaySession) {
      console.log('This device does not support Apple Pay');
      return;
    }

    if (!ApplePaySession.canMakePayments()) {
      console.log('This device is not capable of making Apple Pay payments');
      return;
    }

    const applepay = paypal.Applepay();

    applepay
      .config()
      .then(applepayConfig => {
        if (applepayConfig.isEligible) {
          const applePayContainer =
            document.getElementById('applepay-container');
          if (applePayContainer) {
            // Create the Apple Pay button
            applePayContainer.innerHTML =
              '<apple-pay-button id="btn-appl" buttonstyle="black" type="buy" locale="en"></apple-pay-button>';

            const applePayButton = document.getElementById('btn-appl');
            if (applePayButton) {
              applePayButton.addEventListener('click', () => {
                startApplePaySession(applepay, applepayConfig);
              });
            }
          }
        } else {
          console.log('Apple Pay not eligible for this merchant');
        }
      })
      .catch(error => {
        console.error('Apple Pay config error:', error);
      });
  } catch (error) {
    console.error('Apple Pay initialization error:', error);
  }
}

// Start Apple Pay session with proper callbacks
function startApplePaySession(applepay, applepayConfig) {
  const amount = document.getElementById('amount-input').value || '10.00';

  // Use configuration values from the applepay config
  const request = {
    countryCode: applepayConfig.countryCode,
    merchantCapabilities: applepayConfig.merchantCapabilities,
    supportedNetworks: applepayConfig.supportedNetworks,
    currencyCode: 'USD',
    requiredShippingContactFields: ['name', 'phone', 'email', 'postalAddress'],
    requiredBillingContactFields: ['postalAddress'],
    total: {
      label: 'PayPal Checkout Demo',
      type: 'final',
      amount: amount,
    },
  };

  // Create the session with version 4 as in the PayPal documentation
  const session = new ApplePaySession(4, request);

  // Handle merchant validation
  session.onvalidatemerchant = event => {
    applepay
      .validateMerchant({
        validationUrl: event.validationURL,
        displayName: 'PayPal Checkout Demo',
      })
      .then(validateResult => {
        session.completeMerchantValidation(validateResult.merchantSession);
      })
      .catch(validateError => {
        console.error('Merchant validation failed:', validateError);
        session.abort();
        displayOrderInfo(
          'Apple Pay Error',
          `Merchant validation failed: ${
            validateError.message || 'Unknown error'
          }`
        );
      });
  };

  // Handle payment authorization
  session.onpaymentauthorized = event => {
    // First create an order
    fetch('/api/checkout-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        totalAmount: amount,
        paymentSource: 'applepay',
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(createOrderData => {
        const orderId = createOrderData.id;

        // Confirm the order with Apple Pay token
        return applepay.confirmOrder({
          orderId: orderId,
          token: event.payment.token,
          billingContact: event.payment.billingContact,
          shippingContact: event.payment.shippingContact,
        });
      })
      .then(confirmResult => {
        session.completePayment(ApplePaySession.STATUS_SUCCESS);

        // Capture the payment
        return fetch(`/api/orders/${confirmResult.orderID}/capture`, {
          method: 'POST',
        });
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(captureResult => {
        const transaction =
          captureResult.purchase_units[0].payments.captures[0];
        displayOrderInfo(
          'Apple Pay Payment Successful',
          `Transaction ID: ${transaction.id}<br>
         Amount: ${transaction.amount.value} ${transaction.amount.currency_code}<br>
         Status: ${transaction.status}`
        );
        showSuccessMessage('Apple Pay payment completed successfully!');
      })
      .catch(error => {
        console.error('Apple Pay payment error:', error);
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        displayOrderInfo(
          'Apple Pay Error',
          `Payment failed: ${error.message || 'Unknown error'}`
        );
      });
  };

  // Handle payment cancellation
  session.oncancel = event => {
    console.log('Apple Pay session cancelled');
    displayOrderInfo('Apple Pay Cancelled', 'User cancelled Apple Pay');
  };

  // Start the session
  session.begin();
}

// Create order function
function createOrder(data, actions) {
  const amount = document.getElementById('amount-input').value || '10.00';
  const paymentSource =
    data && data.paymentSource ? data.paymentSource : 'paypal';

  return fetch('/api/checkout-orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      totalAmount: amount,
      paymentSource: paymentSource,
    }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(orderData => {
      displayOrderInfo('Order Created', `Order ID: ${orderData.id}`);
      return orderData.id;
    })
    .catch(error => {
      console.error('Error creating order:', error);
      displayOrderInfo('Error', `Failed to create order: ${error.message}`);
      throw error;
    });
}

// Handle successful payment approval
function onApprove(data, actions) {
  return fetch(`/api/orders/${data.orderID}/capture`, {
    method: 'POST',
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(orderData => {
      const transaction = orderData.purchase_units[0].payments.captures[0];
      displayOrderInfo(
        'Payment Successful',
        `Transaction ID: ${transaction.id}<br>
       Amount: ${transaction.amount.value} ${transaction.amount.currency_code}<br>
       Status: ${transaction.status}`
      );

      // Show success message
      showSuccessMessage('Payment completed successfully!');
    })
    .catch(error => {
      console.error('Error capturing payment:', error);
      displayOrderInfo('Error', `Failed to capture payment: ${error.message}`);
    });
}

// Handle payment cancellation
function onCancel(data) {
  displayOrderInfo('Payment Cancelled', 'User cancelled the payment');
}

// Handle payment errors
function onError(err) {
  console.error('PayPal payment error:', err);
  displayOrderInfo(
    'Payment Error',
    'An error occurred during payment processing'
  );
}

// Display order information
function displayOrderInfo(title, message) {
  const infoSection = document.getElementById('order-info');
  infoSection.innerHTML = `
    <div class="info-item">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
  `;
  infoSection.style.display = 'block';
}

// Show success message
function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.innerHTML = `
    <div class="success-content">
      <h3>✅ ${message}</h3>
      <button onclick="resetCheckout()">Make Another Payment</button>
    </div>
  `;

  document.querySelector('.container').prepend(successDiv);

  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.parentNode.removeChild(successDiv);
    }
  }, 10000);
}

// Reset checkout for another payment
function resetCheckout() {
  document.getElementById('order-info').style.display = 'none';
  const successMessage = document.querySelector('.success-message');
  if (successMessage) {
    successMessage.parentNode.removeChild(successMessage);
  }
}
