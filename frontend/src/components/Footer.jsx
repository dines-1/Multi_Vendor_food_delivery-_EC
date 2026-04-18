import React from 'react';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, UtensilsCrossed } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section brand">
          <div className="footer-logo">
            <div className="logo-icon">
              <UtensilsCrossed size={20} color="#FFF" />
            </div>
            <span>FoodHub</span>
          </div>
          <p>Delivering happiness to your doorstep, one meal at a time. The best restaurants in town, just a click away.</p>
          <div className="social-links">
            <a href="#"><Facebook size={20} /></a>
            <a href="#"><Twitter size={20} /></a>
            <a href="#"><Instagram size={20} /></a>
          </div>
        </div>

        <div className="footer-section links">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Browse Menu</a></li>
            <li><a href="#">Featured Restaurants</a></li>
            <li><a href="#">Join as Vendor</a></li>
            <li><a href="#">Become a Rider</a></li>
          </ul>
        </div>

        <div className="footer-section support">
          <h3>Support</h3>
          <ul>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Refund Policy</a></li>
          </ul>
        </div>

        <div className="footer-section contact">
          <h3>Contact Us</h3>
          <ul className="contact-list">
            <li>
              <MapPin size={18} />
              <span>Baluwatar, Kathmandu</span>
            </li>
            <li>
              <Phone size={18} />
              <span>+977 1 4412345</span>
            </li>
            <li>
              <Mail size={18} />
              <span>support@foodhub.com</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} FoodHub. Developed with ❤️ in Nepal.</p>
      </div>
    </footer>
  );
};

export default Footer;
