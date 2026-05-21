import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';

const FAILURE_REASONS = {
  no_data:             'No payment data received from eSewa.',
  invalid_signature:   'Payment verification failed (signature mismatch).',
  order_not_found:     'Order could not be found.',
  payment_incomplete:  'Payment was not completed.',
  server_error:        'A server error occurred during verification.',
};

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const { fetchCart } = useCart();

  const status  = searchParams.get('status');   // 'success' | 'failed'
  const orderId = searchParams.get('orderId');
  const reason  = searchParams.get('reason');

  const isSuccess = status === 'success';

  useEffect(() => {
    // Refresh cart so it reflects the cleared state after a successful payment
    if (isSuccess) fetchCart();
  }, [isSuccess, fetchCart]);

  return (
    <div className="payment-status-page fade-in">
      <div className="status-card">
        {isSuccess ? (
          <>
            <div className="status-icon success">
              <CheckCircle2 size={80} />
            </div>
            <h1>Payment Successful!</h1>
            <p>Your order has been confirmed and is being prepared by the restaurant.</p>
            <div className="status-actions">
              {orderId ? (
                <Link to={`/track-order/${orderId}`} className="primary-btn">
                  Track Order <Package size={20} />
                </Link>
              ) : (
                <Link to="/orders" className="primary-btn">
                  My Orders <Package size={20} />
                </Link>
              )}
              <Link to="/" className="secondary-btn">Back to Home</Link>
            </div>
          </>
        ) : (
          <>
            <div className="status-icon error">
              <XCircle size={80} />
            </div>
            <h1>Payment Failed</h1>
            <p>{FAILURE_REASONS[reason] || 'Something went wrong with your transaction. Please try again.'}</p>
            <div className="status-actions">
              <Link to="/checkout" className="primary-btn">Retry Checkout</Link>
              <Link to="/" className="secondary-btn">Back to Home</Link>
            </div>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .payment-status-page {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
        }
        .status-card {
          background: white;
          padding: 4rem;
          border-radius: 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.05);
          max-width: 500px;
          width: 100%;
          border: 1px solid #E5E7EB;
        }
        .status-icon {
          margin-bottom: 2rem;
          display: flex;
          justify-content: center;
        }
        .status-icon.success { color: #1DB954; }
        .status-icon.error   { color: #EF4444; }
        .status-card h1 {
          font-size: 2.5rem;
          font-weight: 900;
          color: #121211;
          margin-bottom: 1rem;
        }
        .status-card p {
          color: #6B6560;
          margin-bottom: 3rem;
          font-size: 1.1rem;
          line-height: 1.6;
        }
        .status-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .primary-btn {
          background: #121211;
          color: white;
          padding: 1.25rem;
          border-radius: 18px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          text-decoration: none;
        }
        .secondary-btn {
          color: #121211;
          font-weight: 700;
          text-decoration: none;
        }
      `}} />
    </div>
  );
};

export default PaymentResult;
