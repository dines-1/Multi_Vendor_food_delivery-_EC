import React from 'react';
import { Bike } from 'lucide-react';

const AdminDelivery = () => {
  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">Delivery Partners</div>
      </div>

      <div className="admin-table-container">
        <div className="empty-state">
          <Bike />
          <p>Delivery partner management is currently disabled.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDelivery;
