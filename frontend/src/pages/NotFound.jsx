import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div style={{
      height: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{
        backgroundColor: '#FFF0EA',
        color: '#FF5C1A',
        width: '100px',
        height: '100px',
        borderRadius: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem',
        animation: 'bounce 2s infinite'
      }}>
        <AlertCircle size={48} />
      </div>
      <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#131110', marginBottom: '1rem' }}>404 - Page Not Found</h1>
      <p style={{ fontSize: '1.2rem', color: '#6B6560', maxWidth: '500px', marginBottom: '2.5rem' }}>
        Oops! The page you're looking for doesn't exist or has been moved to another delicious location.
      </p>
      <Link to="/" style={{
        backgroundColor: '#FF5C1A',
        color: 'white',
        padding: '16px 32px',
        borderRadius: '16px',
        textDecoration: 'none',
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 8px 24px rgba(255, 92, 26, 0.3)',
        transition: 'all 0.3s'
      }}>
        <Home size={20} /> Back to Home
      </Link>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
