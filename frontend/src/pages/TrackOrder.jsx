import React, { useState, useEffect, useRef } from 'react';
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
const restaurantIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1275/1275302.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Pulsing rider marker
const createRiderIcon = () => {
  return L.divIcon({
    className: 'rider-pulse-marker',
    html: `
      <div class="rider-marker-inner">
        <div class="rider-pulse-ring"></div>
        <div class="rider-dot">🏍️</div>
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });
};

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

// Calculate distance between two points (Haversine)
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const TrackOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [routeTrail, setRouteTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [eta, setEta] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const restaurantCoords = [27.7172, 85.3240];
  const riderIcon = useRef(createRiderIcon());

  const handleAutoSimulate = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    toast.success('Starting automatic delivery route simulation...');

    const start = restaurantCoords;
    const end = order.delivery_address?.coordinates
      ? [order.delivery_address.coordinates.lat, order.delivery_address.coordinates.lng]
      : [27.7000, 85.3000];

    const steps = 15;
    const path = [];
    for (let i = 0; i <= steps; i++) {
      const pct = i / steps;
      const lat = start[0] + (end[0] - start[0]) * pct;
      const lng = start[1] + (end[1] - start[1]) * pct;
      path.push({ lat, lng });
    }

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= path.length) {
        clearInterval(interval);
        setIsSimulating(false);
        // Simulate order delivery completion
        setOrder(prev => ({ ...prev, status: 'delivered' }));
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
        toast.success('Rider arrived! Order marked as delivered.');
        return;
      }

      const point = path[currentStep];
      socketService.updateLocation(id, point);
      currentStep++;
    }, 1200);
  };

  useEffect(() => {
    fetchOrderDetails();

    const socket = socketService.connect();
    socketService.joinOrderRoom(id);

    socketService.onLocationUpdate((data) => {
      const newLoc = data.location;
      setDeliveryLocation(newLoc);
      setRouteTrail(prev => [...prev, [newLoc.lat, newLoc.lng]]);
    });

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

  // Calculate ETA and progress when delivery location changes
  useEffect(() => {
    if (deliveryLocation && order) {
      const customerCoords = order.delivery_address?.coordinates
        ? [order.delivery_address.coordinates.lat, order.delivery_address.coordinates.lng]
        : [27.7000, 85.3000];

      const distToCustomer = calcDistance(
        deliveryLocation.lat, deliveryLocation.lng,
        customerCoords[0], customerCoords[1]
      );

      const totalDist = calcDistance(
        restaurantCoords[0], restaurantCoords[1],
        customerCoords[0], customerCoords[1]
      );

      // ETA: assuming ~25 km/h average speed
      const etaMinutes = Math.max(1, Math.round((distToCustomer / 25) * 60));
      setEta(etaMinutes);

      // Progress: what % of total distance has rider covered
      const distFromRestaurant = calcDistance(
        restaurantCoords[0], restaurantCoords[1],
        deliveryLocation.lat, deliveryLocation.lng
      );
      const pct = Math.min(100, Math.round((distFromRestaurant / totalDist) * 100));
      setProgress(pct);
    }
  }, [deliveryLocation, order]);

  const fetchOrderDetails = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/orders/my-orders`, {
        withCredentials: true
      });
      const currentOrder = data.data.find(o => o._id === id);
      if (currentOrder) {
        setOrder(currentOrder);
        if (currentOrder.delivery_person_id?.current_location) {
          const loc = currentOrder.delivery_person_id.current_location;
          setDeliveryLocation(loc);
          setRouteTrail([[loc.lat, loc.lng]]);
        }
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
  if (deliveryLocation) {
    activeMarkers.push([deliveryLocation.lat, deliveryLocation.lng]);
  }

  // Build the full route path: restaurant → trail → customer
  const routePath = [
    restaurantCoords,
    ...routeTrail,
  ];

  // Planned route (dashed line to customer)
  const plannedRoute = deliveryLocation
    ? [[deliveryLocation.lat, deliveryLocation.lng], customerCoords]
    : [restaurantCoords, customerCoords];

  const statusSteps = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
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
        {eta && !isDelivered && (
          <div className="eta-badge">
            <div className="eta-pulse"></div>
            ~{eta} min
          </div>
        )}
      </header>

      <div className="track-container">
        <div className="track-info">
          {/* Progress bar */}
          {!isDelivered && deliveryLocation && (
            <div className="delivery-progress-card">
              <div className="progress-header">
                <span>Delivery Progress</span>
                <span className="progress-pct">{progress}%</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          <div className="status-timeline">
            {statusSteps.map((step, index) => (
              <div key={step} className={`status-step ${index <= currentStepIndex ? 'active' : ''}`}>
                <div className="step-icon">
                  {step === 'pending' && <Package size={18} />}
                  {step === 'confirmed' && <CheckCircle size={18} />}
                  {step === 'preparing' && <ChefHat size={18} />}
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

          {/* MOCK CONTROLLER FOR DEMO PURPOSES */}
          <div className="demo-controls">
            <h4>Live Tracking Simulator</h4>
            <div className="btn-group">
              <button 
                onClick={handleAutoSimulate} 
                disabled={isSimulating}
                style={{ background: '#FF5C1A', color: '#fff', fontWeight: 'bold', width: '100%' }}
              >
                {isSimulating ? 'Animating Journey...' : '🚀 Start Auto-Simulation'}
              </button>
            </div>
          </div>
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

            {/* Animated delivery route trail (solid) */}
            {routeTrail.length > 0 && (
              <Polyline
                positions={routePath}
                pathOptions={{
                  color: '#FF5C1A',
                  weight: 4,
                  opacity: 0.9,
                  dashArray: null,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )}

            {/* Planned remaining route (dashed) */}
            <Polyline
              positions={plannedRoute}
              pathOptions={{
                color: '#FF5C1A',
                weight: 3,
                opacity: 0.3,
                dashArray: '10, 10',
              }}
            />

            {/* Delivery person marker with pulse */}
            {deliveryLocation && (
              <Marker
                position={[deliveryLocation.lat, deliveryLocation.lng]}
                icon={riderIcon.current}
              >
                <Popup>Delivery Person is here</Popup>
              </Marker>
            )}

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
