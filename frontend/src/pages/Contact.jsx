import React from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  const contactMethods = [
    {
      name: 'Call',
      icon: 'Phone',
      link: 'tel:+977-1-4234567',
      color: '#3B82F6',
    },
    {
      name: 'Email',
      icon: 'Email',
      link: 'mailto:support@chulo.com',
      color: '#EF4444',
    },
  ];

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-content">
          <span className="hero-eyebrow">Get in Touch</span>
          <h1>We're here to help</h1>
          <p>Reach us by phone or email for customer support</p>
        </div>
      </section>

      <div className="contact-content">
        <section className="contact-info-section">
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">
                <Mail size={24} />
              </div>
              <h3>Email</h3>
              <p className="info-label">Send us an email</p>
              <a href="mailto:support@chulo.com" className="info-link">support@chulo.com</a>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <Phone size={24} />
              </div>
              <h3>Phone</h3>
              <p className="info-label">Call us anytime</p>
              <a href="tel:+977-1-4234567" className="info-link">+977-1-4234567</a>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <MapPin size={24} />
              </div>
              <h3>Office</h3>
              <p className="info-label">Visit us</p>
              <p className="info-address">Baluwatar, Kathmandu, Nepal</p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <Clock size={24} />
              </div>
              <h3>Hours</h3>
              <p className="info-label">We're available</p>
              <p className="info-hours">Mon - Fri: 9AM - 6PM<br />Sat - Sun: 10AM - 4PM</p>
            </div>
          </div>
        </section>

        <section className="communication-section">
          <div className="section-header">
            <h2>Choose Your Preferred Contact Method</h2>
            <p>Call us directly or send an email to our support team</p>
          </div>

          <div className="contact-methods-grid">
            {contactMethods.map((method, idx) => (
              <a
                key={idx}
                href={method.link}
                className="contact-method-btn"
                style={{ borderTopColor: method.color }}
              >
                <span className="method-icon">{method.icon}</span>
                <span className="method-name">{method.name}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="map-section">
          <div className="section-header">
            <h2>Find Us on the Map</h2>
            <p>Our office location in Kathmandu</p>
          </div>

          <div className="map-container">
            <iframe
              title="Chulo Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.5245896857737!2d85.32755!3d27.7172!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb190c3b4b5555%3A0x1234567890!2sBaluwatar%2C%20Kathmandu!5e0!3m2!1sen!2snp!4v1234567890"
              width="100%"
              height="450"
              style={{ border: 0, borderRadius: '14px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="map-info">
            <div className="map-info-card">
              <MapPin size={20} />
              <div>
                <h4>Our Address</h4>
                <p>Baluwatar, Kathmandu<br />Nepal, 44600</p>
              </div>
            </div>
          </div>
        </section>

        <section className="faq-section">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Can't find what you're looking for?</p>
          </div>

          <div className="faq-grid">
            <div className="faq-item">
              <h3>How does Chulo work?</h3>
              <p>Chulo connects you with local restaurants, showing real-time menus and live availability. Order your favorite dishes with guaranteed fast delivery.</p>
            </div>

            <div className="faq-item">
              <h3>What areas do you deliver to?</h3>
              <p>Currently, we operate in Kathmandu and nearby areas. We're expanding to new cities regularly. Check your location in the app to see if we're available near you.</p>
            </div>

            <div className="faq-item">
              <h3>How long does delivery take?</h3>
              <p>Most deliveries take 30-45 minutes. We offer a 30-minute guarantee on selected orders. Delivery time varies based on restaurant distance and order complexity.</p>
            </div>

            <div className="faq-item">
              <h3>What payment methods do you accept?</h3>
              <p>We accept credit cards, debit cards, digital wallets (eSewa, Khalti), and cash on delivery in selected areas. Choose your preferred method at checkout.</p>
            </div>

            <div className="faq-item">
              <h3>Can I cancel my order?</h3>
              <p>You can cancel orders up to 2 minutes after placing them. Once the restaurant starts preparing, cancellation fees may apply. Contact support for assistance.</p>
            </div>

            <div className="faq-item">
              <h3>How can I become a restaurant partner?</h3>
              <p>Interested in joining Chulo? Email us at partners@chulo.com with your restaurant details, and our team will guide you through the onboarding process.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;
