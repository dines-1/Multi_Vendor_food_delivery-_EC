import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle,
  Eye,
  Filter,
  Search,
  ChevronDown,
  User,
  Phone,
  MapPin
} from 'lucide-react';
import './VendorOrders.css';

const statusMap = {
  'pending': { color: '#F59E0B', label: 'New Order', icon: Clock },
  'confirmed': { color: '#3B82F6', label: 'Preparing', icon: ShoppingBag },
  'preparing': { color: '#8B5CF6', label: 'In Kitchen', icon: ShoppingBag },
  'ready': { color: '#10B981', label: 'Ready for Pickup', icon: CheckCircle },
  'out-for-delivery': { color: '#6366F1', label: 'Out for Delivery', icon: Truck },
  'delivered': { color: '#059669', label: 'Delivered', icon: CheckCircle },
  'cancelled': { color: '#EF4444', label: 'Cancelled', icon: XCircle }
};

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/vendor/my-orders');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders();
        if (selectedOrder?._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) return <div className="vendor-loading">Loading Orders...</div>;

  return (
    <div className="vendor-orders-container">
      <div className="orders-header">
        <h1>Order Management</h1>
        <p>Monitor and update your restaurant's active orders</p>
      </div>

      <div className="orders-toolbar">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by Order # or Customer name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
          <Filter size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">New Orders</option>
            <option value="confirmed">Preparing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="orders-content">
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-orders">
              <ShoppingBag size={48} />
              <p>No orders found matching your criteria</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div 
                key={order._id} 
                className={`order-card ${selectedOrder?._id === order._id ? 'active' : ''}`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="order-card-header">
                  <span className="order-num">#{order.orderNumber}</span>
                  <span className="order-time">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="order-card-body">
                  <div className="customer-mini">
                    <User size={14} />
                    <span>{order.customer?.name}</span>
                  </div>
                  <div className="order-summary">
                    {order.items.length} items • Rs. {order.total_amount}
                  </div>
                </div>
                <div className="order-card-footer">
                  <div className="status-indicator" style={{ color: statusMap[order.status].color }}>
                    {React.createElement(statusMap[order.status].icon, { size: 14 })}
                    <span>{statusMap[order.status].label}</span>
                  </div>
                  <ChevronDown size={16} className="arrow" />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="order-details-panel">
          {selectedOrder ? (
            <div className="details-view fade-in">
              <div className="details-header">
                <h2>Order Details</h2>
                <div className="status-badge-lg" style={{ backgroundColor: statusMap[selectedOrder.status].color }}>
                   {statusMap[selectedOrder.status].label}
                </div>
              </div>

              <div className="details-section">
                <h3>Customer Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <User size={16} />
                    <div>
                      <label>Name</label>
                      <span>{selectedOrder.customer?.name}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <Phone size={16} />
                    <div>
                      <label>Phone</label>
                      <span>{selectedOrder.customer?.phone || 'Not provided'}</span>
                    </div>
                  </div>
                  <div className="info-item full">
                    <MapPin size={16} />
                    <div>
                      <label>Delivery Address</label>
                      <span>{selectedOrder.delivery_address?.street}, {selectedOrder.delivery_address?.area}, {selectedOrder.delivery_address?.city}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Order Items</h3>
                <div className="items-list">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="detail-item">
                      <div className="item-qty">{item.quantity}x</div>
                      <div className="item-name-box">
                        <div className="name">{item.name}</div>
                        {item.special_notes && <div className="notes">Note: {item.special_notes}</div>}
                      </div>
                      <div className="item-price">Rs. {item.subtotal}</div>
                    </div>
                  ))}
                </div>
                <div className="order-total-bar">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>Rs. {selectedOrder.subtotal}</span>
                  </div>
                  <div className="total-row main">
                    <span>Grand Total</span>
                    <span>Rs. {selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>

              <div className="details-actions">
                <h3>Update Order Status</h3>
                <div className="action-buttons">
                  {selectedOrder.status === 'pending' && (
                    <button className="btn-confirm" onClick={() => updateStatus(selectedOrder._id, 'confirmed')}>
                      Confirm & Start Preparing
                    </button>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button className="btn-ready" onClick={() => updateStatus(selectedOrder._id, 'ready')}>
                      Mark as Ready for Pickup
                    </button>
                  )}
                  {['pending', 'confirmed', 'preparing'].includes(selectedOrder.status) && (
                    <button className="btn-cancel" onClick={() => updateStatus(selectedOrder._id, 'cancelled')}>
                      Cancel Order
                    </button>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <div className="waiting-msg">
                      Waiting for Delivery Personnel to pick up...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <ShoppingBag size={64} />
              <p>Select an order from the list to view details and take actions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorOrders;
