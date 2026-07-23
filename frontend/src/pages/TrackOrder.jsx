import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChefHat, MapPin, Navigation, Package, CheckCircle, ArrowLeft, Star, PartyPopper } from 'lucide-react';
import { toast } from 'react-hot-toast';
import socketService from '../utils/socket.js';
import axios from 'axios';
import ReviewModal from '../components/ReviewModal';
import './TrackOrder.css';

// Fix for default marker icons in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom Icons
const restaurantIcon = new L.divIcon({
  className: 'custom-marker-res',
  html: '<div style="font-size: 30px; line-height: 1; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.35))">🏪</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const customerIcon = new L.divIcon({
  className: 'custom-marker-cust',
  html: '<div style="font-size: 30px; line-height: 1; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.35))">🏠</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

// Helper component to center map when markers change
function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
}

const TrackOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const restaurantCoords = [27.7172, 85.3240];

  useEffect(() => {
    fetchOrderDetails();

    const socket = socketService.connect();
    socketService.joinOrderRoom(id);

    socketService.onStatusUpdate((data) => {
      setOrder(prev => ({ ...prev, status: data.status }));
      toast.success(`Order status updated: ${data.status.replace('_', ' ')}`);

      if (data.status === 'delivered') {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }
    });

    return () => {
      socketService.leaveOrderRoom(id);
    };
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/orders/my-orders`, {
        withCredentials: true
      });
      const currentOrder = data.data.find(o => o._id === id);
      if (currentOrder) {
        setOrder(currentOrder);
      } else {
        toast.error('Order not found');
        navigate('/');
      }
    } catch (err) {
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading Tracker...</div>;
  if (!order) return <div className="error">Order not found.</div>;

  const customerCoords = order.delivery_address?.coordinates
    ? [order.delivery_address.coordinates.lat, order.delivery_address.coordinates.lng]
    : [27.7000, 85.3000];

  const activeMarkers = [restaurantCoords, customerCoords];

  // Build the full route path: restaurant → trail → customer

  // Planned route (dashed line to customer)
  const plannedRoute = [restaurantCoords, customerCoords];

  const statusSteps = ['pending', 'confirmed', 'preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered'];
  const currentStepIndex = statusSteps.indexOf(order.status);
  const isDelivered = order.status === 'delivered';

  return (
    <div className="track-order-page">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-content">
            <div className="celebration-emoji">🎉</div>
            <h2>Order Delivered!</h2>
            <p>Your food has arrived. Enjoy your meal!</p>
            <button className="rate-now-btn" onClick={() => { setShowCelebration(false); setShowReview(true); }}>
              <Star size={18} /> Rate Your Experience
            </button>
          </div>
        </div>
      )}

      <header className="track-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1>Track Order #{order.orderNumber}</h1>
      </header>

      <div className="track-container">
        <div className="track-info">
          {/* Progress bar */}
          <div className="status-timeline">
            {statusSteps.map((step, index) => (
              <div key={step} className={`status-step ${index <= currentStepIndex ? 'active' : ''}`}>
                <div className="step-icon">
                  {step === 'pending' && <Package size={18} />}
                  {step === 'confirmed' && <CheckCircle size={18} />}
                  {step === 'preparing' && <ChefHat size={18} />}
                  {step === 'ready_for_delivery' && <Package size={18} />}
                  {step === 'out_for_delivery' && <Navigation size={18} />}
                  {step === 'delivered' && <MapPin size={18} />}
                </div>
                <span className="step-label">{step.split('_').join(' ')}</span>
              </div>
            ))}
          </div>

          <div className="order-summary">
            <h3>Order Details</h3>
            <p><strong>Restaurant:</strong> {order.restaurant?.name}</p>
            <p><strong>Total:</strong> Rs. {order.total_amount}</p>
            <div className="address-box">
              <MapPin size={16} />
              <span>{order.delivery_address.street}, {order.delivery_address.area}</span>
            </div>
          </div>

          {isDelivered && (
            <div className="action-buttons-grid">
              {isDelivered && (
                <button className="action-card-btn review" onClick={() => setShowReview(true)}>
                  <Star size={20} />
                  <span>Rate Order</span>
                </button>
              )}
            </div>
          )}

        </div>

        <div className="map-view">
          <MapContainer center={restaurantCoords} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Restaurant marker */}
            <Marker position={restaurantCoords} icon={restaurantIcon}>
              <Popup>Restaurant: {order.restaurant?.name}</Popup>
            </Marker>

            {/* Customer marker */}
            <Marker position={customerCoords} icon={customerIcon}>
              <Popup>Your Location</Popup>
            </Marker>

            <Polyline
              positions={plannedRoute}
              pathOptions={{
                color: '#FF5C1A',
                weight: 3,
                opacity: 0.3,
                dashArray: '10, 10',
              }}
            />

            <RecenterMap coords={activeMarkers} />
          </MapContainer>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReview}
        onClose={(submitted) => {
          setShowReview(false);
          if (submitted) toast.success('Thanks for your review!');
        }}
        orderId={order._id}
        restaurantName={order.restaurant?.name}
      />

    </div>
  );
};

export default TrackOrder;
