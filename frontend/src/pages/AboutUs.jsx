import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Heart,
  Users,
  TrendingUp,
  ArrowRight,
  Award,
  Globe,
  Leaf,
} from 'lucide-react';
import './AboutUs.css';

const AboutUs = () => {
  const values = [
    {
      icon: Heart,
      title: 'Customer First',
      description: 'Every decision we make puts our customers at the center. Your satisfaction drives everything we do.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'We build a thriving ecosystem connecting customers, restaurants, and delivery partners into one community.',
    },
    {
      icon: Leaf,
      title: 'Sustainability',
      description: 'We support local restaurants and reduce food waste by keeping menus live and accurate in real-time.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'We constantly improve technology to make food delivery faster, easier, and more reliable.',
    },
  ];

  const milestones = [
    { year: '2023', title: 'Founded', description: 'Chulo launches in Kathmandu' },
    { year: '2024', title: '50+ Restaurants', description: 'Partnered with local favorites' },
    { year: '2024', title: '10K+ Orders', description: 'Serving the community daily' },
    { year: '2025', title: 'Expanding', description: 'Growing to new cities' },
  ];

  const stats = [
    { number: '50+', label: 'Restaurants' },
    { number: '500+', label: 'Menu Items' },
    { number: '30 min', label: 'Avg Delivery' },
    { number: '99%', label: 'Uptime' },
  ];

  return (
    <div className="about-page">
      {/* ── HERO ── */}
      <section className="about-hero">
        <div className="hero-content">
          <span className="hero-eyebrow">
            <Zap size={14} /> Our Story
          </span>
          <h1>Fresh food from real kitchens</h1>
          <p>We're on a mission to make food delivery honest, fast, and delicious by connecting you with local restaurants that have food actually available right now.</p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div className="stat-card" key={idx}>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION & VISION ── */}
      <section className="mission-section">
        <div className="mission-container">
          <article className="mission-card">
            <div className="mission-icon">
              <Globe size={32} />
            </div>
            <h3>Our Mission</h3>
            <p>To revolutionize food delivery in Kathmandu by providing real-time menu visibility, fast delivery, and a seamless experience for customers, restaurants, and delivery partners.</p>
          </article>

          <article className="mission-card">
            <div className="mission-icon">
              <TrendingUp size={32} />
            </div>
            <h3>Our Vision</h3>
            <p>To become the most trusted food delivery platform in Nepal, where every order is fulfilled with excellence, every restaurant thrives, and every meal brings joy.</p>
          </article>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="values-section">
        <div className="section-header">
          <span className="section-kicker">Core Values</span>
          <h2>What drives us</h2>
        </div>
        <div className="values-grid">
          {values.map((value, idx) => {
            const Icon = value.icon;
            return (
              <div className="value-card" key={idx}>
                <div className="value-icon">
                  <Icon size={28} />
                </div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── JOURNEY ── */}
      <section className="journey-section">
        <div className="section-header">
          <span className="section-kicker">Timeline</span>
          <h2>Our journey</h2>
        </div>
        <div className="timeline">
          {milestones.map((milestone, idx) => (
            <div className="timeline-item" key={idx}>
              <div className="timeline-marker">
                <div className="marker-dot" />
                {idx < milestones.length - 1 && <div className="marker-line" />}
              </div>
              <div className="timeline-content">
                <span className="timeline-year">{milestone.year}</span>
                <h4>{milestone.title}</h4>
                <p>{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY FOODHUB ── */}
      <section className="why-section">
        <div className="section-header">
          <span className="section-kicker">Why Choose Us</span>
          <h2>What makes Chulo different</h2>
        </div>

        <div className="why-grid">
          <article className="why-card">
            <div className="why-icon">🍽️</div>
            <h3>Real-Time Menus</h3>
            <p>See exactly what's available right now. No more ordering items that are already sold out or closed restaurants.</p>
          </article>

          <article className="why-card">
            <div className="why-icon">⚡</div>
            <h3>Lightning Fast</h3>
            <p>Most deliveries arrive in 30 minutes or less. Our 30-minute guarantee means you pay nothing if we're late.</p>
          </article>

          <article className="why-card">
            <div className="why-icon">💎</div>
            <h3>Quality Partners</h3>
            <p>We handpick restaurants that maintain the highest standards. Every delivery is backed by our quality promise.</p>
          </article>

          <article className="why-card">
            <div className="why-icon">🛡️</div>
            <h3>Safe & Secure</h3>
            <p>Your data is encrypted, your payment is secure, and your food arrives clean. Trust is our foundation.</p>
          </article>

          <article className="why-card">
            <div className="why-icon">🌟</div>
            <h3>24/7 Support</h3>
            <p>Something went wrong? Our support team is always ready to help. Chat, call, or email us anytime.</p>
          </article>

          <article className="why-card">
            <div className="why-icon">🤝</div>
            <h3>Supporting Local</h3>
            <p>Every order helps local restaurants grow. We're invested in your community's food business.</p>
          </article>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="about-cta">
        <div className="cta-content">
          <h2>Ready to taste the difference?</h2>
          <p>Join thousands of satisfied customers enjoying fresh, real food delivered fast.</p>
          <Link to="/explore" className="cta-btn">
            Start Ordering <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
