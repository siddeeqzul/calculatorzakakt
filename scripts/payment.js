
/**
 * SecurePay API integration for ZakatNOW
 * Handles payment processing for zakat payments
 */

class SecurePayService {
    constructor(apiKey, merchantId) {
        this.apiKey = apiKey;
        this.merchantId = merchantId;
        this.apiEndpoint = 'https://api.securepay.my/v1/payments'; // Replace with actual SecurePay API endpoint
        this.isTestMode = true; // Set to false in production
    }

    /**
     * Initialize the payment form with SecurePay client library
     */
    initializePayment() {
        // This would typically load SecurePay's JS SDK
        console.log('Initializing SecurePay integration');
        
        // Create a mock function for demo purposes
        window.SecurePay = {
            initialize: (config) => {
                console.log('SecurePay initialized with config:', config);
                return {
                    createPayment: this.createPayment.bind(this)
                };
            }
        };
        
        // Add event listener to payment form submission
        document.getElementById('paymentForm')?.addEventListener('submit', this.handlePaymentSubmit.bind(this));
    }

    /**
     * Handle payment form submission
     */
    handlePaymentSubmit(event) {
        event.preventDefault();
        
        const paymentForm = document.getElementById('paymentForm');
        const paymentAmount = document.getElementById('paymentAmount').value;
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
        
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            this.showPaymentMessage('error', 'Sila masukkan jumlah pembayaran yang sah.');
            return;
        }
        
        if (!paymentMethod) {
            this.showPaymentMessage('error', 'Sila pilih kaedah pembayaran.');
            return;
        }
        
        // Show loading indicator
        this.showPaymentProcessing(true);
        
        // In a real implementation, we would call the SecurePay API here
        // For demo purposes, we'll simulate a successful payment after a delay
        setTimeout(() => {
            // Simulate successful payment
            const success = Math.random() > 0.2; // 80% success rate for demo
            
            if (success) {
                this.showPaymentComplete({
                    status: 'success',
                    transactionId: 'TRX' + Math.floor(Math.random() * 1000000),
                    amount: paymentAmount,
                    method: paymentMethod,
                    date: new Date().toISOString()
                });
            } else {
                this.showPaymentMessage('error', 'Pembayaran gagal. Sila cuba lagi.');
                this.showPaymentProcessing(false);
            }
        }, 2000);
    }

    /**
     * Create a payment with SecurePay
     * In a real implementation, this would communicate with the SecurePay API
     */
    createPayment(paymentDetails) {
        return new Promise((resolve, reject) => {
            console.log('Creating payment with details:', paymentDetails);
            
            // Mock API call
            setTimeout(() => {
                if (this.isTestMode) {
                    resolve({
                        success: true,
                        transactionId: 'TRX' + Math.floor(Math.random() * 1000000),
                        amount: paymentDetails.amount,
                        currency: 'MYR',
                        status: 'completed'
                    });
                } else {
                    // Make an actual API call to SecurePay
                    fetch(this.apiEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.apiKey}`
                        },
                        body: JSON.stringify({
                            merchantId: this.merchantId,
                            amount: paymentDetails.amount,
                            currency: 'MYR',
                            description: 'Zakat Payment',
                            customerEmail: paymentDetails.email,
                            redirectUrl: window.location.href,
                            callbackUrl: 'https://your-server-callback-url.com/webhook'
                        })
                    })
                    .then(response => response.json())
                    .then(data => resolve(data))
                    .catch(error => reject(error));
                }
            }, 1000);
        });
    }

    /**
     * Show payment processing state
     */
    showPaymentProcessing(isProcessing) {
        const processingIndicator = document.getElementById('paymentProcessing');
        const paymentForm = document.getElementById('paymentForm');
        const paymentSuccess = document.getElementById('paymentSuccess');
        
        if (processingIndicator) {
            processingIndicator.style.display = isProcessing ? 'block' : 'none';
        }
        
        if (paymentForm) {
            paymentForm.style.display = isProcessing ? 'none' : 'block';
        }
        
        if (paymentSuccess) {
            paymentSuccess.style.display = 'none';
        }
    }

    /**
     * Show payment success message
     */
    showPaymentComplete(paymentResult) {
        const processingIndicator = document.getElementById('paymentProcessing');
        const paymentForm = document.getElementById('paymentForm');
        const paymentSuccess = document.getElementById('paymentSuccess');
        const paymentDetails = document.getElementById('paymentDetails');
        
        if (processingIndicator) {
            processingIndicator.style.display = 'none';
        }
        
        if (paymentForm) {
            paymentForm.style.display = 'none';
        }
        
        if (paymentSuccess) {
            paymentSuccess.style.display = 'block';
            
            // Format payment details
            const formattedDate = new Date(paymentResult.date).toLocaleDateString('ms-MY', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Update payment details
            paymentDetails.innerHTML = `
                <p><strong>ID Transaksi:</strong> ${paymentResult.transactionId}</p>
                <p><strong>Jumlah:</strong> RM ${parseFloat(paymentResult.amount).toFixed(2)}</p>
                <p><strong>Kaedah:</strong> ${this.formatPaymentMethod(paymentResult.method)}</p>
                <p><strong>Tarikh:</strong> ${formattedDate}</p>
            `;
            
            // Store payment in local history (in a real app, this would be server-side)
            this.savePaymentToHistory(paymentResult);
        }
    }

    /**
     * Format payment method name for display
     */
    formatPaymentMethod(methodCode) {
        const methods = {
            'fpx': 'FPX Online Banking',
            'card': 'Kad Kredit/Debit',
            'wallet': 'E-Wallet',
            'qr': 'QR Pay'
        };
        
        return methods[methodCode] || methodCode;
    }

    /**
     * Save payment to local history
     */
    savePaymentToHistory(payment) {
        let paymentHistory = JSON.parse(localStorage.getItem('zakatPaymentHistory') || '[]');
        paymentHistory.push({
            ...payment,
            timestamp: new Date().getTime()
        });
        localStorage.setItem('zakatPaymentHistory', JSON.stringify(paymentHistory));
    }

    /**
     * Show payment message (error or info)
     */
    showPaymentMessage(type, message) {
        const paymentMessage = document.getElementById('paymentMessage');
        
        if (paymentMessage) {
            paymentMessage.textContent = message;
            paymentMessage.className = `payment-message ${type}`;
            paymentMessage.style.display = 'block';
            
            // Hide message after a delay
            setTimeout(() => {
                paymentMessage.style.display = 'none';
            }, 5000);
        }
    }
}

// Initialize payment service when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Replace these with your actual SecurePay API credentials
    const paymentService = new SecurePayService('YOUR_API_KEY', 'YOUR_MERCHANT_ID');
    
    // Make service available globally
    window.paymentService = paymentService;
    
    // Initialize payment service
    paymentService.initializePayment();
    
    // Add event listener to payment button
    document.getElementById('payZakatButton')?.addEventListener('click', () => {
        const zakatAmount = document.getElementById('zakatResult')?.textContent.match(/RM\s+([\d,]+\.\d{2})/)?.[1];
        
        if (zakatAmount) {
            // Pre-fill payment amount
            document.getElementById('paymentAmount').value = zakatAmount.replace(/,/g, '');
            
            // Show payment modal
            document.getElementById('paymentModal').style.display = 'block';
        }
    });
    
    // Close payment modal when clicking outside or on close button
    document.getElementById('closePayment')?.addEventListener('click', () => {
        document.getElementById('paymentModal').style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('paymentModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
