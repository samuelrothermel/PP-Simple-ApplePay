// Simple PayPal Checkout Implementation

// Global debug state
let debugDetailsVisible = false;
let debugLogs = [];

// Function to add debug information to the UI
function addDebugInfo(message, type = 'info') {
  debugLogs.push({ message, type, timestamp: new Date().toLocaleTimeString() });
  updateDebugDisplay();
}

// Function to update the debug display
function updateDebugDisplay() {
  const debugInfo = document.getElementById('applepay-debug-info');
  if (!debugInfo) return;

  const isAppleDevice = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  const isSafari =
    /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const hasApplePaySession = !!window.ApplePaySession;
  const canMakePayments = hasApplePaySession
    ? ApplePaySession.canMakePayments()
    : false;

  let statusIcon = '❌';
  let statusText = 'Not Available';
  let statusColor = '#dc3545';

  if (isAppleDevice && isSafari && hasApplePaySession && canMakePayments) {
    statusIcon = '✅';
    statusText = 'Available';
    statusColor = '#28a745';
  } else if (isAppleDevice && isSafari && hasApplePaySession) {
    statusIcon = '⚠️';
    statusText = 'Partially Available';
    statusColor = '#ffc107';
  }

  let html = `
    <div style="margin-bottom: 10px;">
      <strong style="color: ${statusColor};">${statusIcon} Apple Pay Status: ${statusText}</strong>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
      <div>Device: ${isAppleDevice ? '✅ Apple' : '❌ Non-Apple'}</div>
      <div>Browser: ${
        isSafari
          ? '✅ Safari'
          : '❌ ' +
            (navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other')
      }</div>
      <div>ApplePaySession: ${
        hasApplePaySession ? '✅ Available' : '❌ Missing'
      }</div>
      <div>Can Make Payments: ${canMakePayments ? '✅ Yes' : '❌ No'}</div>
      <div>Protocol: ${
        window.location.protocol === 'https:' ? '✅ HTTPS' : '⚠️ HTTP'
      }</div>
      <div>Domain: ${window.location.hostname}</div>
    </div>
  `;

  if (debugDetailsVisible && debugLogs.length > 0) {
    html += `
      <div style="max-height: 200px; overflow-y: auto; background: #fff; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
        <strong>Recent Debug Logs:</strong><br>
        ${debugLogs
          .slice(-20)
          .map(
            log =>
              `<div style="font-family: monospace; font-size: 10px; margin: 2px 0; color: ${
                log.type === 'error'
                  ? '#dc3545'
                  : log.type === 'warn'
                  ? '#ffc107'
                  : '#6c757d'
              };">
            [${log.timestamp}] ${log.message}
          </div>`
          )
          .join('')}
      </div>
    `;
  }

  debugInfo.innerHTML = html;
}

// Function to toggle debug details
function toggleDebugDetails() {
  debugDetailsVisible = !debugDetailsVisible;
  const button = document.getElementById('toggle-debug-details');
  if (button) {
    button.textContent = debugDetailsVisible
      ? 'Hide Detailed Logs'
      : 'Show Detailed Logs';
  }
  updateDebugDisplay();
}

// Override console methods to capture logs
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.log = function (...args) {
  originalConsoleLog.apply(console, args);
  const message = args.join(' ');
  if (message.includes('🍎 [Apple Pay Debug]')) {
    addDebugInfo(message.replace('🍎 [Apple Pay Debug]', '').trim(), 'info');
  }
};

console.warn = function (...args) {
  originalConsoleWarn.apply(console, args);
  const message = args.join(' ');
  if (message.includes('🍎 [Apple Pay Debug]')) {
    addDebugInfo(message.replace('🍎 [Apple Pay Debug]', '').trim(), 'warn');
  }
};

console.error = function (...args) {
  originalConsoleError.apply(console, args);
  const message = args.join(' ');
  if (message.includes('🍎 [Apple Pay Debug]')) {
    addDebugInfo(message.replace('🍎 [Apple Pay Debug]', '').trim(), 'error');
  }
};

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function () {
  // Initialize debug display
  setTimeout(updateDebugDisplay, 100);

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
  console.log('🍎 [Apple Pay Debug] Loading PayPal SDK...');

  // Enable card fields by removing card from disable-funding
  const scriptUrl = `https://www.paypal.com/sdk/js?components=buttons,card-fields,messages,applepay&intent=capture&client-id=${clientId}&enable-funding=venmo,paylater,applepay&currency=USD`;

  console.log('🍎 [Apple Pay Debug] PayPal SDK URL:', scriptUrl);
  console.log('🍎 [Apple Pay Debug] Client ID:', clientId);

  const scriptElement = document.createElement('script');
  scriptElement.src = scriptUrl;
  scriptElement.onload = () => {
    console.log('🍎 [Apple Pay Debug] ✅ PayPal SDK loaded successfully');
    initializePayPal();
  };
  scriptElement.onerror = error => {
    console.error('🍎 [Apple Pay Debug] ❌ Failed to load PayPal SDK:', error);
    displayOrderInfo(
      'PayPal SDK Error',
      'Failed to load PayPal SDK. Please check your internet connection and try again.'
    );
  };

  document.head.appendChild(scriptElement);
}

// Initialize PayPal components after SDK loads
function initializePayPal() {
  console.log('🍎 [Apple Pay Debug] Starting PayPal initialization...');

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

  // Comprehensive Apple Pay debugging
  console.log('🍎 [Apple Pay Debug] Checking Apple Pay support...');
  console.log('🍎 [Apple Pay Debug] User Agent:', navigator.userAgent);
  console.log('🍎 [Apple Pay Debug] Platform:', navigator.platform);
  console.log(
    '🍎 [Apple Pay Debug] Is macOS/iOS:',
    /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
  );
  console.log(
    '🍎 [Apple Pay Debug] Is Safari:',
    /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
  );
  console.log('🍎 [Apple Pay Debug] Protocol:', window.location.protocol);
  console.log('🍎 [Apple Pay Debug] Hostname:', window.location.hostname);

  // Check PayPal Apple Pay availability
  console.log(
    '🍎 [Apple Pay Debug] paypal.Applepay exists:',
    !!paypal.Applepay
  );
  console.log(
    '🍎 [Apple Pay Debug] window.ApplePaySession exists:',
    !!window.ApplePaySession
  );

  if (window.ApplePaySession) {
    console.log(
      '🍎 [Apple Pay Debug] ApplePaySession.canMakePayments():',
      ApplePaySession.canMakePayments()
    );
    console.log(
      '🍎 [Apple Pay Debug] ApplePaySession.supportsVersion(3):',
      ApplePaySession.supportsVersion(3)
    );
    console.log(
      '🍎 [Apple Pay Debug] ApplePaySession.supportsVersion(4):',
      ApplePaySession.supportsVersion(4)
    );

    // Check for specific payment networks
    try {
      const networks = [
        'visa',
        'masterCard',
        'amex',
        'discover',
        'chinaUnionPay',
        'interac',
        'jcb',
        'maestro',
      ];
      console.log('🍎 [Apple Pay Debug] Testing payment networks...');
      networks.forEach(network => {
        try {
          const canMakePayments =
            ApplePaySession.canMakePaymentsWithActiveCard(network);
          console.log(`🍎 [Apple Pay Debug] ${network}: ${canMakePayments}`);
        } catch (e) {
          console.log(
            `🍎 [Apple Pay Debug] ${network}: Error testing - ${e.message}`
          );
        }
      });
    } catch (error) {
      console.warn(
        '🍎 [Apple Pay Debug] Error testing payment networks:',
        error
      );
    }
  } else {
    console.warn('🍎 [Apple Pay Debug] ApplePaySession not available');
    console.log('🍎 [Apple Pay Debug] This could mean:');
    console.log('🍎 [Apple Pay Debug] - Not running on Safari/iOS');
    console.log('🍎 [Apple Pay Debug] - Not running on a supported device');
    console.log(
      '🍎 [Apple Pay Debug] - Not running on HTTPS (required for production)'
    );
    console.log(
      '🍎 [Apple Pay Debug] - Apple Pay not configured in system preferences'
    );
  }

  // Initialize Apple Pay (if supported)
  if (
    paypal.Applepay &&
    window.ApplePaySession &&
    ApplePaySession.canMakePayments()
  ) {
    console.log(
      '🍎 [Apple Pay Debug] ✅ All checks passed - initializing Apple Pay'
    );
    initializeApplePay();
  } else {
    console.warn(
      '🍎 [Apple Pay Debug] ❌ Apple Pay not supported or not available'
    );
    console.log('🍎 [Apple Pay Debug] Failed checks:');
    console.log('🍎 [Apple Pay Debug] - paypal.Applepay:', !!paypal.Applepay);
    console.log(
      '🍎 [Apple Pay Debug] - window.ApplePaySession:',
      !!window.ApplePaySession
    );
    console.log(
      '🍎 [Apple Pay Debug] - ApplePaySession.canMakePayments():',
      window.ApplePaySession ? ApplePaySession.canMakePayments() : 'N/A'
    );

    // Hide Apple Pay section
    const applePaySection = document.getElementById('applepay-section');
    if (applePaySection) {
      applePaySection.style.display = 'none';
      console.log('🍎 [Apple Pay Debug] Hidden Apple Pay section');
    }
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
  console.log('🍎 [Apple Pay Debug] Starting Apple Pay initialization...');

  try {
    const applepay = paypal.Applepay();
    console.log(
      '🍎 [Apple Pay Debug] PayPal Apple Pay instance created successfully'
    );

    console.log('🍎 [Apple Pay Debug] Calling applepay.config()...');
    applepay
      .config()
      .then(applepayConfig => {
        console.log(
          '🍎 [Apple Pay Debug] Apple Pay config received:',
          applepayConfig
        );
        console.log(
          '🍎 [Apple Pay Debug] isEligible:',
          applepayConfig.isEligible
        );
        console.log(
          '🍎 [Apple Pay Debug] countryCode:',
          applepayConfig.countryCode
        );
        console.log(
          '🍎 [Apple Pay Debug] merchantCapabilities:',
          applepayConfig.merchantCapabilities
        );
        console.log(
          '🍎 [Apple Pay Debug] supportedNetworks:',
          applepayConfig.supportedNetworks
        );

        if (applepayConfig.isEligible) {
          console.log(
            '🍎 [Apple Pay Debug] ✅ Apple Pay is eligible - creating button'
          );

          const applePayContainer =
            document.getElementById('applepay-container');
          if (applePayContainer) {
            console.log(
              '🍎 [Apple Pay Debug] Apple Pay container found, adding button'
            );
            applePayContainer.innerHTML =
              '<apple-pay-button id="btn-appl" buttonstyle="black" type="buy" locale="en"></apple-pay-button>';

            console.log('🍎 [Apple Pay Debug] Apple Pay button HTML added');

            const applePayButton = document.getElementById('btn-appl');
            if (applePayButton) {
              console.log(
                '🍎 [Apple Pay Debug] Apple Pay button element found, adding event listener'
              );
              applePayButton.addEventListener('click', () => {
                console.log('🍎 [Apple Pay Debug] Apple Pay button clicked!');
                startApplePaySession(applepay);
              });
              console.log(
                '🍎 [Apple Pay Debug] ✅ Apple Pay button setup complete'
              );
            } else {
              console.error(
                '🍎 [Apple Pay Debug] ❌ Apple Pay button element not found after creation'
              );
            }
          } else {
            console.error(
              '🍎 [Apple Pay Debug] ❌ Apple Pay container not found'
            );
          }
        } else {
          console.warn('🍎 [Apple Pay Debug] ❌ Apple Pay not eligible');
          console.log('🍎 [Apple Pay Debug] Possible reasons:');
          console.log(
            '🍎 [Apple Pay Debug] - PayPal account not configured for Apple Pay'
          );
          console.log(
            '🍎 [Apple Pay Debug] - Merchant not verified with Apple'
          );
          console.log('🍎 [Apple Pay Debug] - Geographic restrictions');
          console.log('🍎 [Apple Pay Debug] - Currency not supported');

          const applePaySection = document.getElementById('applepay-section');
          if (applePaySection) {
            applePaySection.style.display = 'none';
            console.log(
              '🍎 [Apple Pay Debug] Hidden Apple Pay section due to ineligibility'
            );
          }
        }
      })
      .catch(error => {
        console.error('🍎 [Apple Pay Debug] ❌ Apple Pay config error:', error);
        console.error('🍎 [Apple Pay Debug] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });

        const applePaySection = document.getElementById('applepay-section');
        if (applePaySection) {
          applePaySection.style.display = 'none';
          console.log(
            '🍎 [Apple Pay Debug] Hidden Apple Pay section due to config error'
          );
        }
      });
  } catch (error) {
    console.error(
      '🍎 [Apple Pay Debug] ❌ Apple Pay initialization error:',
      error
    );
    console.error('🍎 [Apple Pay Debug] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    const applePaySection = document.getElementById('applepay-section');
    if (applePaySection) {
      applePaySection.style.display = 'none';
      console.log(
        '🍎 [Apple Pay Debug] Hidden Apple Pay section due to initialization error'
      );
    }
  }
}

// Start Apple Pay session with proper callbacks
function startApplePaySession(applepay) {
  console.log('🍎 [Apple Pay Debug] Starting Apple Pay session...');

  const amount = document.getElementById('amount-input').value || '10.00';
  console.log('🍎 [Apple Pay Debug] Payment amount:', amount);

  const request = {
    countryCode: 'US',
    currencyCode: 'USD',
    supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
    merchantCapabilities: ['supports3DS'],
    total: {
      label: 'PayPal Checkout Demo',
      amount: amount,
      type: 'final',
    },
  };

  console.log('🍎 [Apple Pay Debug] Apple Pay request object:', request);

  try {
    console.log('🍎 [Apple Pay Debug] Creating ApplePaySession...');
    const session = new ApplePaySession(3, request);
    console.log('🍎 [Apple Pay Debug] ✅ ApplePaySession created successfully');

    // Handle merchant validation
    session.onvalidatemerchant = event => {
      console.log('🍎 [Apple Pay Debug] 🔐 Merchant validation requested');
      console.log('🍎 [Apple Pay Debug] Validation URL:', event.validationURL);

      applepay
        .validateMerchant({
          validationUrl: event.validationURL,
          displayName: 'PayPal Checkout Demo',
        })
        .then(validateResult => {
          console.log('🍎 [Apple Pay Debug] ✅ Merchant validation successful');
          console.log(
            '🍎 [Apple Pay Debug] Validation result:',
            validateResult
          );
          session.completeMerchantValidation(validateResult.merchantSession);
        })
        .catch(validateError => {
          console.error(
            '🍎 [Apple Pay Debug] ❌ Merchant validation failed:',
            validateError
          );
          console.error('🍎 [Apple Pay Debug] Validation error details:', {
            name: validateError.name,
            message: validateError.message,
            stack: validateError.stack,
          });
          session.abort();
          displayOrderInfo(
            'Apple Pay Error',
            `Merchant validation failed: ${validateError.message}`
          );
        });
    };

    // Handle payment authorization
    session.onpaymentauthorized = event => {
      console.log('🍎 [Apple Pay Debug] 💳 Payment authorized');
      console.log('🍎 [Apple Pay Debug] Payment token received');
      console.log(
        '🍎 [Apple Pay Debug] Billing contact:',
        event.payment.billingContact
      );
      console.log(
        '🍎 [Apple Pay Debug] Shipping contact:',
        event.payment.shippingContact
      );

      // First create an order
      console.log('🍎 [Apple Pay Debug] Creating order...');
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
          console.log(
            '🍎 [Apple Pay Debug] Order creation response status:',
            response.status
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(createOrderData => {
          console.log(
            '🍎 [Apple Pay Debug] ✅ Order created successfully:',
            createOrderData
          );
          const orderId = createOrderData.id;

          // Confirm the order with Apple Pay token
          console.log(
            '🍎 [Apple Pay Debug] Confirming order with Apple Pay token...'
          );
          return applepay.confirmOrder({
            orderId: orderId,
            token: event.payment.token,
            billingContact: event.payment.billingContact,
            shippingContact: event.payment.shippingContact,
          });
        })
        .then(confirmResult => {
          console.log(
            '🍎 [Apple Pay Debug] ✅ Order confirmed successfully:',
            confirmResult
          );
          session.completePayment(ApplePaySession.STATUS_SUCCESS);

          // Capture the payment
          console.log('🍎 [Apple Pay Debug] Capturing payment...');
          return fetch(`/api/orders/${confirmResult.orderID}/capture`, {
            method: 'POST',
          });
        })
        .then(response => {
          console.log(
            '🍎 [Apple Pay Debug] Capture response status:',
            response.status
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(captureResult => {
          console.log(
            '🍎 [Apple Pay Debug] ✅ Payment captured successfully:',
            captureResult
          );
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
          console.error(
            '🍎 [Apple Pay Debug] ❌ Apple Pay payment error:',
            error
          );
          console.error('🍎 [Apple Pay Debug] Payment error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          displayOrderInfo(
            'Apple Pay Error',
            `Payment failed: ${error.message}`
          );
        });
    };

    // Handle payment cancellation
    session.oncancel = event => {
      console.log('🍎 [Apple Pay Debug] ❌ Payment cancelled by user');
      displayOrderInfo('Apple Pay Cancelled', 'User cancelled Apple Pay');
    };

    // Start the session
    console.log('🍎 [Apple Pay Debug] 🚀 Beginning Apple Pay session...');
    session.begin();
    console.log(
      '🍎 [Apple Pay Debug] ✅ Apple Pay session started successfully'
    );
  } catch (error) {
    console.error(
      '🍎 [Apple Pay Debug] ❌ Error creating or starting Apple Pay session:',
      error
    );
    console.error('🍎 [Apple Pay Debug] Session error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    displayOrderInfo('Apple Pay Error', `Session failed: ${error.message}`);
  }
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
