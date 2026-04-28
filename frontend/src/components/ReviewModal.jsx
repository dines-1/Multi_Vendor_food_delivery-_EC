import React, { useState } from 'react';
import { Star, X, Send, CheckCircle } from 'lucide-react';
import reviewService from '../services/reviewService';
import toast from 'react-hot-toast';
import './ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, orderId, restaurantName }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      await reviewService.submitReview(orderId, rating, comment);
      setSubmitted(true);
      setTimeout(() => {
        onClose(true); // true = submitted successfully
        // Reset state
        setRating(0);
        setComment('');
        setSubmitted(false);
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div className="review-overlay" onClick={() => onClose(false)}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="review-success">
            <div className="success-icon-wrap">
              <CheckCircle size={64} />
            </div>
            <h2>Thank You!</h2>
            <p>Your review has been submitted successfully.</p>
          </div>
        ) : (
          <>
            <div className="review-modal-header">
              <div>
                <h2>Rate Your Experience</h2>
                <p className="review-restaurant-name">{restaurantName}</p>
              </div>
              <button className="review-close-btn" onClick={() => onClose(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="review-modal-body">
              <div className="star-rating-section">
                <div className="stars-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star
                        size={40}
                        fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                </div>
                <span className="rating-label">
                  {ratingLabels[hoverRating || rating] || 'Tap to rate'}
                </span>
              </div>

              <div className="review-comment-section">
                <label>Share your thoughts (optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the food quality, delivery experience, packaging...?"
                  rows={4}
                  maxLength={500}
                />
                <span className="char-count">{comment.length}/500</span>
              </div>
            </div>

            <div className="review-modal-footer">
              <button
                className="submit-review-btn"
                onClick={handleSubmit}
                disabled={loading || rating === 0}
              >
                {loading ? (
                  <div className="btn-spinner"></div>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
