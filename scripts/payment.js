/**
 * SecurePay.my API integration for ZakatNOW
 * Handles payment processing for zakat payments
 * Based on https://docs.securepay.my/api
 */

class SecurePayService {
    constructor(apiKey, merchantId) {
        this.apiKey = apiKey;
        this.merchantId = merchantId;
        this.apiEndpoint = 'https://api.securepay.my'; // Base API URL
        this.isTestMode = true; // Set to false in production
    }

    /**
     * Initialize the payment form
     */
    initializePayment() {
        console.log('Initializing SecurePay.my integration');
        
        // Load SecurePay.my JS SDK if needed
        if (!document.getElementById('securepay-js')) {
            const script = document.createElement('script');
            script.id = 'securepay-js';
            script.src = 'https://js.securepay.my/v1/securepay.js';
            script.async = true;
            document.body.appendChild(script);
        }
        
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
        const customerName = document.getElementById('customerName')?.value;
        const customerEmail = document.getElementById('customerEmail')?.value;
        const customerPhone = document.getElementById('customerPhone')?.value;
        
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            this.showPaymentMessage('error', 'Sila masukkan jumlah pembayaran yang sah.');
            return;
        }
        
        if (!paymentMethod) {
            this.showPaymentMessage('error', 'Sila pilih kaedah pembayaran.');
            return;
        }
        
        if (!customerEmail) {
            this.showPaymentMessage('error', 'Sila masukkan alamat emel.');
            return;
        }
        
        // Show loading indicator
        this.showPaymentProcessing(true);
        
        // Create payment payload based on SecurePay.my API requirements
        const payload = {
            amount: parseFloat(paymentAmount).toFixed(2),
            currency: 'MYR',
            reference_id: 'ZAKAT-' + Date.now(),
            description: 'Pembayaran Zakat',
            customer: {
                name: customerName || 'Pembayar Zakat',
                email: customerEmail,
                phone: customerPhone || ''
            },
            payment: {
                method: this.mapPaymentMethod(paymentMethod)
            },
            redirect: {
                return_url: window.location.href + '?payment_status=completed',
                cancel_url: window.location.href + '?payment_status=cancelled'
            },
            metadata: {
                source: 'ZakatNOW Calculator'
            }
        };
        
        // In production, this request should be made from your server to protect API keys
        if (this.isTestMode) {
            // Simulate API call for demo purposes
            setTimeout(() => {
                const success = Math.random() > 0.2; // 80% success rate for demo
                
                if (success) {
                    // Simulate redirect to payment gateway
                    this.showPaymentMessage('info', 'Mengalihkan ke gateway pembayaran...');
                    
                    setTimeout(() => {
                        // For demo, we'll just show success without actual redirect
                        this.showPaymentComplete({
                            status: 'success',
                            transaction_id: 'SPM' + Math.floor(Math.random() * 1000000),
                            amount: paymentAmount,
                            method: paymentMethod,
                            date: new Date().toISOString()
                        });
                    }, 1500);
                } else {
                    this.showPaymentMessage('error', 'Pembayaran gagal. Sila cuba lagi.');
                    this.showPaymentProcessing(false);
                }
            }, 2000);
        } else {
            // Production implementation - make actual API call to SecurePay.my
            this.createPaymentSession(payload)
                .then(response => {
                    if (response.success && response.checkout_url) {
                        // Redirect to SecurePay.my checkout page
                        window.location.href = response.checkout_url;
                    } else {
                        throw new Error(response.message || 'Payment creation failed');
                    }
                })
                .catch(error => {
                    this.showPaymentMessage('error', 'Pembayaran gagal: ' + error.message);
                    this.showPaymentProcessing(false);
                });
        }
    }

    /**
     * Map internal payment method codes to SecurePay.my payment methods
     */
    mapPaymentMethod(internalMethod) {
        const methodMapping = {
            'fpx': 'fpx',
            'card': 'card',
            'wallet': 'boost', // Default to Boost for wallet, could be expanded
            'qr': 'duitnow_qr'
        };
        
        return methodMapping[internalMethod] || 'fpx';
    }

    /**
     * Create a payment session with SecurePay.my
     * In production, this should be done from your server to keep API keys secure
     */
    createPaymentSession(paymentDetails) {
        return fetch(`${this.apiEndpoint}/v1/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'X-Merchant-ID': this.merchantId
            },
            body: JSON.stringify(paymentDetails)
        })
        .then(response => response.json())
        .catch(error => {
            console.error('Error creating payment session:', error);
            throw new Error('Network error when connecting to payment gateway');
        });
    }

    /**
     * Check payment status with SecurePay.my API
     * This would typically be used after returning from the payment gateway
     */
    checkPaymentStatus(paymentId) {
        return fetch(`${this.apiEndpoint}/v1/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'X-Merchant-ID': this.merchantId
            }
        })
        .then(response => response.json())
        .catch(error => {
            console.error('Error checking payment status:', error);
            throw new Error('Network error when checking payment status');
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
                <p><strong>ID Transaksi:</strong> ${paymentResult.transaction_id || paymentResult.id || 'N/A'}</p>
                <p><strong>Jumlah:</strong> RM ${parseFloat(paymentResult.amount).toFixed(2)}</p>
                <p><strong>Kaedah:</strong> ${this.formatPaymentMethod(paymentResult.method)}</p>
                <p><strong>Tarikh:</strong> ${formattedDate}</p>
                <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">Berjaya</span></p>
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
            'boost': 'Boost e-Wallet',
            'tng': 'Touch n Go e-Wallet',
            'grabpay': 'GrabPay',
            'duitnow_qr': 'DuitNow QR',
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
    
    /**
     * Check payment status from URL parameters (after redirect back from gateway)
     */
    checkPaymentStatusFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment_status');
        const paymentId = urlParams.get('payment_id');
        
        if (paymentStatus === 'completed' && paymentId) {
            // In production, verify this status server-side
            this.checkPaymentStatus(paymentId)
                .then(result => {
                    if (result.success && result.status === 'paid') {
                        this.showPaymentComplete(result);
                        
                        // Clean up URL parameters
                        const url = new URL(window.location.href);
                        url.searchParams.delete('payment_status');
                        url.searchParams.delete('payment_id');
                        window.history.replaceState({}, document.title, url.toString());
                    } else {
                        this.showPaymentMessage('error', 'Pengesahan pembayaran gagal. Sila hubungi pihak pentadbir.');
                    }
                })
                .catch(error => {
                    this.showPaymentMessage('error', 'Ralat pengesahan: ' + error.message);
                });
        } else if (paymentStatus === 'cancelled') {
            this.showPaymentMessage('info', 'Pembayaran dibatalkan.');
            
            // Clean up URL parameters
            const url = new URL(window.location.href);
            url.searchParams.delete('payment_status');
            window.history.replaceState({}, document.title, url.toString());
        }
    }
}

// Initialize payment service when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Replace these with your actual SecurePay.my API credentials
    const paymentService = new SecurePayService(
        'sp_test_yourApiKey', // API key from SecurePay.my dashboard
        'M12345678'  // Merchant ID from SecurePay.my dashboard
    );
    
    // Make service available globally
    window.paymentService = paymentService;
    
    // Check for returning payment flow
    paymentService.checkPaymentStatusFromUrl();
    
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
