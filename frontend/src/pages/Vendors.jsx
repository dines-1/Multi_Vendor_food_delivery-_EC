import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Store,
  Search,
  MapPin,
  Clock,
  Star,
  Utensils,
  ArrowRight,
  Phone,
  Mail,
  X,
  PlusCircle,
  ShoppingBag,
  ChefHat
} from 'lucide-react';
import restaurantService from '../services/restaurantService';
import { getDocs, normalizeRestaurant } from '../utils/customerData';
import './Vendors.css';

const CUISINES_LIST = ['All', 'Nepali', 'Indian', 'Chinese', 'Italian', 'Fast Food', 'Pizza', 'Bakery', 'Cafe'];

const Vendors = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedVendorContact, setSelectedVendorContact] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const res = await restaurantService.getRestaurants({ limit: 100 });
        if (!mounted) return;
        const normalized = getDocs(res).map(normalizeRestaurant);
        // Only display active vendors to customers
        setVendors(normalized.filter(v => !v.status || v.status === 'active'));
      } catch (err) {
        console.error('Failed to load vendors:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchVendors();
    return () => { mounted = false; };
  }, []);

  const filteredVendors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vendors.filter((vendor) => {
      const matchesQuery = !q || [
        vendor.name,
        vendor.area,
        vendor.city,
        ...(vendor.cuisines || [])
      ].some(val => String(val || '').toLowerCase().includes(q));

      const matchesCuisine = selectedCuisine === 'All' ||
        (vendor.cuisines || []).some(c => c.toLowerCase() === selectedCuisine.toLowerCase());

      return matchesQuery && matchesCuisine;
    });
  }, [vendors, searchQuery, selectedCuisine]);

  return (
    <div className="vendors-page">
      {/* ── HERO SECTION ── */}
      <section className="vendors-hero">
        <div className="vendors-hero-container">
          <span className="vendors-eyebrow">
            <Store size={14} /> Vendor Directory &amp; Partner Network
          </span>
          <h1>Our Partner Vendors &amp; Kitchens</h1>
          <p>
            Explore Kathmandu&apos;s finest restaurants and vendor partners. Order directly from verified kitchens or join our platform as a vendor today.
          </p>

          {/* CUSTOMER ACTION BUTTONS */}
          <div className="vendors-hero-actions">
            <button
              type="button"
              className="vendors-btn vendors-btn-primary"
              onClick={() => navigate('/register-restaurant')}
            >
              <PlusCircle size={18} />
              <span>Register as Vendor</span>
            </button>
            <button
              type="button"
              className="vendors-btn vendors-btn-secondary"
              onClick={() => navigate('/explore')}
            >
              <ShoppingBag size={18} />
              <span>Explore All Dishes</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── SEARCH & FILTER STRIP ── */}
      <section className="vendors-filter-strip">
        <div className="vendors-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor name, cuisine, or area..."
          />
          {searchQuery && (
            <button type="button" className="clear-btn" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="vendors-cuisine-pills">
          {CUISINES_LIST.map((cuisine) => (
            <button
              key={cuisine}
              type="button"
              className={`cuisine-pill ${selectedCuisine === cuisine ? 'active' : ''}`}
              onClick={() => setSelectedCuisine(cuisine)}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </section>

      {/* ── VENDORS GRID ── */}
      <section className="vendors-grid-container">
        <div className="vendors-grid-header">
          <h2>
            {filteredVendors.length} {filteredVendors.length === 1 ? 'Vendor' : 'Vendors'} Available
          </h2>
          {searchQuery && <span className="search-results-tag">Filtering for &ldquo;{searchQuery}&rdquo;</span>}
        </div>

        {loading ? (
          <div className="vendors-skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="vendor-card-skeleton" />
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="vendors-empty">
            <ChefHat size={44} color="#94A3B8" />
            <h3>No vendors found</h3>
            <p>Try searching for a different area or cuisine, or clear your filters.</p>
            <button
              type="button"
              className="vendors-btn vendors-btn-secondary"
              onClick={() => { setSearchQuery(''); setSelectedCuisine('All'); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="vendors-grid">
            {filteredVendors.map((vendor) => (
              <article key={vendor.id} className="vendor-card">
                <div className="vendor-card-banner">
                  <img src={vendor.image} alt={vendor.name} className="vendor-img" />
                  <div className="vendor-rating-badge">
                    <Star size={12} fill="currentColor" />
                    <span>{vendor.rating ? vendor.rating.toFixed(1) : 'New'}</span>
                  </div>
                </div>

                <div className="vendor-card-body">
                  <h3 className="vendor-title">{vendor.name}</h3>

                  <div className="vendor-cuisines">
                    {(vendor.cuisines || []).length > 0 ? (
                      vendor.cuisines.map((c) => (
                        <span key={c} className="vendor-cuisine-tag">{c}</span>
                      ))
                    ) : (
                      <span className="vendor-cuisine-tag">Multi-Cuisine</span>
                    )}
                  </div>

                  <div className="vendor-meta">
                    <div className="meta-row">
                      <MapPin size={14} />
                      <span>{vendor.area || 'Kathmandu'}, {vendor.city || 'Kathmandu'}</span>
                    </div>
                    <div className="meta-row">
                      <Clock size={14} />
                      <span>{vendor.hours || '10:00 AM - 10:00 PM'}</span>
                    </div>
                  </div>

                  {/* CUSTOMER ACTION BUTTONS ON CARD */}
                  <div className="vendor-card-actions">
                    <button
                      type="button"
                      className="vendor-action-btn primary-action"
                      onClick={() => navigate(`/restaurant/${vendor.id}`)}
                    >
                      <Utensils size={15} />
                      <span>View Menu &amp; Order</span>
                    </button>
                    <button
                      type="button"
                      className="vendor-action-btn secondary-action"
                      onClick={() => setSelectedVendorContact(vendor)}
                      title="Contact Vendor"
                    >
                      <Phone size={15} />
                      <span>Contact</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── PARTNER CTA BANNER FOR CUSTOMERS/VENDORS ── */}
      <section className="vendors-partner-cta">
        <div className="cta-content">
          <span className="cta-badge">Partner With Chulo</span>
          <h2>Are you a restaurant owner?</h2>
          <p>
            Reach thousands of hungry customers every day. List your kitchen on Chulo, manage your menu, and track sales easily.
          </p>
          <div className="cta-buttons">
            <Link to="/register-restaurant" className="vendors-btn vendors-btn-primary">
              <Store size={18} />
              <span>Join as Vendor Partner</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── VENDOR CONTACT MODAL ── */}
      {selectedVendorContact && (
        <div className="vendor-modal-backdrop" onClick={() => setSelectedVendorContact(null)}>
          <div className="vendor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-modal-header">
              <div className="modal-title-group">
                <img src={selectedVendorContact.image} alt={selectedVendorContact.name} className="modal-avatar" />
                <div>
                  <h3>{selectedVendorContact.name}</h3>
                  <span>Vendor Partner</span>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedVendorContact(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="vendor-modal-body">
              <div className="contact-detail-row">
                <MapPin size={18} className="contact-icon" />
                <div>
                  <strong>Address</strong>
                  <p>{selectedVendorContact.area}, {selectedVendorContact.city}</p>
                </div>
              </div>

              <div className="contact-detail-row">
                <Clock size={18} className="contact-icon" />
                <div>
                  <strong>Operating Hours</strong>
                  <p>{selectedVendorContact.hours || '10:00 AM - 10:00 PM'}</p>
                </div>
              </div>

              <div className="contact-detail-row">
                <Utensils size={18} className="contact-icon" />
                <div>
                  <strong>Cuisines</strong>
                  <p>{(selectedVendorContact.cuisines || []).join(', ') || 'Multi-Cuisine'}</p>
                </div>
              </div>
            </div>

            <div className="vendor-modal-footer">
              <button
                type="button"
                className="vendors-btn vendors-btn-primary full-width"
                onClick={() => {
                  const id = selectedVendorContact.id;
                  setSelectedVendorContact(null);
                  navigate(`/restaurant/${id}`);
                }}
              >
                <Utensils size={16} />
                <span>View Full Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;
