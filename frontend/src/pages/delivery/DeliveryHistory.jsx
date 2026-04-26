import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './DeliveryDashboard.css';

const DeliveryHistory = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/delivery/history');
                setHistory(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <div className="delivery-loading">Loading History...</div>;

    return (
        <div className="delivery-container fade-in">
            <div className="delivery-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="tb-name">Delivery History</h2>
                </div>
            </div>

            <div style={{ padding: '20px' }}>
                <div className="history-summary-card">
                    <div className="summary-item">
                        <span className="summary-val">{history.length}</span>
                        <span className="summary-lbl">Deliveries</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-val">4.9</span>
                        <span className="summary-lbl">Avg Rating</span>
                    </div>
                </div>

                <div className="history-list">
                    {history.map(item => (
                        <div key={item._id} className="history-card">
                            <div className="hist-header">
                                <div className="hist-status">
                                    <CheckCircle2 size={16} color="#16A34A" />
                                    <span>Delivered</span>
                                </div>
                                <span className="hist-date">{new Date(item.delivered_at).toLocaleDateString()}</span>
                            </div>
                            <div className="hist-body">
                                <h3>{item.restaurant?.name}</h3>
                                <div className="hist-loc">
                                    <MapPin size={14} />
                                    <span>{item.delivery_address?.area}</span>
                                </div>
                            </div>
                            <div className="hist-footer">
                                <span className="hist-id">#{item.orderNumber}</span>
                                <span className="hist-amount">+Rs {item.delivery_fee}</span>
                            </div>
                        </div>
                    ))}

                    {history.length === 0 && (
                        <div className="empty-state">
                            <Calendar size={48} />
                            <p>No past deliveries found.</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .history-summary-card {
                    background: #131110;
                    border-radius: 20px;
                    padding: 24px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1px;
                    margin-bottom: 24px;
                }
                .summary-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    color: white;
                }
                .summary-val { font-size: 1.5rem; font-weight: 800; color: #FF5C1A; }
                .summary-lbl { font-size: 0.75rem; opacity: 0.6; margin-top: 4px; }
                
                .history-list { display: flex; flex-direction: column; gap: 16px; }
                .history-card {
                    background: white;
                    border-radius: 18px;
                    padding: 20px;
                    border: 1px solid #E5E7EB;
                }
                .hist-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
                .hist-status { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; color: #16A34A; }
                .hist-date { font-size: 0.75rem; color: #6B7280; }
                .hist-body h3 { font-size: 1rem; font-weight: 800; margin-bottom: 4px; }
                .hist-loc { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #6B7280; }
                .hist-footer { display: flex; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 1px solid #F1F3F5; }
                .hist-id { font-size: 0.8rem; font-weight: 600; color: #9CA3AF; }
                .hist-amount { font-weight: 800; color: #16A34A; font-size: 1rem; }
                .empty-state { text-align: center; padding: 60px 0; color: #9CA3AF; }
                .empty-state p { margin-top: 12px; font-weight: 600; }
            `}</style>
        </div>
    );
};

export default DeliveryHistory;
