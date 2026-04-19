import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChefHat, MapPin, Navigation, Package, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import socketService from '../utils/socket.js';
import axios from 'axios';
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

const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1275/1275302.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
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
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
    
    // Connect to websocket
    const socket = socketService.connect();
    socketService.joinOrderRoom(id);

    // Listen for location updates
    socketService.onLocationUpdate((data) => {
      console.log('Location update received:', data);
      setDeliveryLocation(data.location);
    });

    // Listen for status updates
    socketService.onStatusUpdate((data) => {
      console.log('Status update received:', data);
      setOrder(prev => ({ ...prev, status: data.status }));
      toast.success(`Order status updated: ${data.status.replace('_', ' ')}`);
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
        // Initial delivery location could be from the delivery person model if assigned
        if (currentOrder.delivery_person_id?.current_location) {
          setDeliveryLocation(currentOrder.delivery_person_id.current_location);
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

  const restaurantCoords = [27.7172, 85.3240]; // Mock default if not found
  const customerCoords = order.delivery_address?.coordinates 
    ? [order.delivery_address.coordinates.lat, order.delivery_address.coordinates.lng] 
    : [27.7000, 85.3000];
  
  const activeMarkers = [restaurantCoords, customerCoords];
  if (deliveryLocation) {
    activeMarkers.push([deliveryLocation.lat, deliveryLocation.lng]);
  }

  const statusSteps = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="track-order-page">
      <header className="track-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1>Track Order #{order.orderNumber}</h1>
      </header>

      <div className="track-container">
        <div className="track-info">
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

          {/* MOCK CONTROLLER FOR DEMO PURPOSES */}
          <div className="demo-controls">
            <h4>Demo Controls (Delivery Simulation)</h4>
            <div className="btn-group">
                <button onClick={() => socketService.updateLocation(id, { lat: 27.7100, lng: 85.3100 })}>Move to Point A</button>
                <button onClick={() => socketService.updateLocation(id, { lat: 27.7050, lng: 85.3050 })}>Move near Home</button>
            </div>
          </div>
        </div>

        <div className="map-view">
          <MapContainer center={restaurantCoords} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <Marker position={restaurantCoords} icon={restaurantIcon}>
              <Popup>Restaurant: {order.restaurant?.name}</Popup>
            </Marker>

            <Marker position={customerCoords} icon={customerIcon}>
              <Popup>Your Location</Popup>
            </Marker>

            {deliveryLocation && (
              <Marker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={deliveryIcon}>
                <Popup>Delivery Person is here</Popup>
              </Marker>
            )}

            <RecenterMap coords={activeMarkers} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
