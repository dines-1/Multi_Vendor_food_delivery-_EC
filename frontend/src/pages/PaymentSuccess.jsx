import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Package } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';

const PaymentSuccess = () => {
  const { method } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const verify = async () => {
      try {
        if (method === 'esewa') {
          // eSewa verification is handled by redirect from backend to /orders?success=true
          setStatus('success');
        } else {
          setStatus('success');
        }
        await fetchCart(); // Clear local cart state by fetching fresh empty cart
      } catch (err) {
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [method, searchParams, fetchCart]);

  if (loading) {
    return (
      <div className="payment-status-page loading">
        <div className="spinner"></div>
        <h2>Verifying Payment...</h2>
      </div>
    );
  }

  return (
    <div className="payment-status-page fade-in">
      <div className="status-card">
        {status === 'success' ? (
          <>
            <div className="status-icon success">
              <CheckCircle2 size={80} />
            </div>
            <h1>Payment Successful!</h1>
            <p>Your order has been placed and is being prepared by the restaurant.</p>
            <div className="status-actions">
              <Link to="/orders" className="primary-btn">
                Track Order <Package size={20} />
              </Link>
              <Link to="/" className="secondary-btn">Back to Home</Link>
            </div>
          </>
        ) : (
          <>
            <div className="status-icon error">
              <XCircle size={80} />
            </div>
            <h1>Payment Failed</h1>
            <p>Something went wrong with your transaction. Please try again.</p>
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
        .status-icon.error { color: #EF4444; }
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
        }
        .secondary-btn {
          color: #121211;
          font-weight: 700;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #F3F4F6;
          border-top: 5px solid #121211;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 2rem;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default PaymentSuccess;
