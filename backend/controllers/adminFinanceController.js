import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';

const DEFAULT_COMMISSION_RATE = 10;

// ==================== REVENUE ====================

export const getRevenueReport = async (req, res) => {
  try {
    const gmv = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'confirmed', 'preparing'] } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]);

    const totalGMV = gmv[0]?.total || 0;
    const commissionEarned = totalGMV * (DEFAULT_COMMISSION_RATE / 100);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const chartData = await Order.aggregate([
      { $match: { ordered_at: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$ordered_at' } },
          gmv: { $sum: '$total_amount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalGMV,
        commissionEarned,
        netRevenue: commissionEarned,
        commissionRate: DEFAULT_COMMISSION_RATE,
        chartData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== COMMISSION ====================

export const getCommissionSettings = async (req, res) => {
  try {
    const vendorsWithCustom = await Restaurant.find({ commissionRate: { $ne: null } }).select('name commissionRate');
    res.json({
      success: true,
      data: { globalRate: DEFAULT_COMMISSION_RATE, vendorOverrides: vendorsWithCustom },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCommission = async (req, res) => {
  try {
    // Global rate is a constant — to make it configurable, use env vars
    // This endpoint updates vendor-specific override if vendorId is provided
    const { vendorId, rate } = req.body;
    if (vendorId) {
      await Restaurant.findByIdAndUpdate(vendorId, { commissionRate: rate });
    }
    res.json({ success: true, message: 'Commission updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== VENDOR EARNINGS ====================

export const getVendorEarnings = async (req, res) => {
  try {
    const vendors = await Restaurant.find({ status: 'active' }).select('name commissionRate totalSales payoutBalance');

    const earnings = await Promise.all(
      vendors.map(async (v) => {
        const rate = v.commissionRate ?? DEFAULT_COMMISSION_RATE;
        const sales = await Order.aggregate([
          { $match: { restaurant: v._id, status: 'delivered' } },
          { $group: { _id: null, gross: { $sum: '$total_amount' } } },
        ]);
        const gross = sales[0]?.gross || 0;
        const commission = gross * (rate / 100);
        const refunds = await Order.aggregate([
          { $match: { restaurant: v._id, refundStatus: 'approved' } },
          { $group: { _id: null, total: { $sum: '$refundAmount' } } },
        ]);
        const totalRefunds = refunds[0]?.total || 0;

        return {
          vendorId: v._id,
          vendorName: v.name,
          grossSales: gross,
          commissionRate: rate,
          commissionDeducted: commission,
          refunds: totalRefunds,
          netPayable: gross - commission - totalRefunds,
        };
      })
    );

    res.json({ success: true, data: earnings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== PAYOUTS (using Restaurant model) ====================

export const getPayoutRequests = async (req, res) => {
  try {
    const { status = '' } = req.query;
    const query = { payoutStatus: { $ne: 'none' } };
    if (status) query.payoutStatus = status;

    const vendors = await Restaurant.find(query)
      .select('name payoutBalance payoutStatus lastPayoutAmount lastPayoutDate lastPayoutRef')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processPayoutRequest = async (req, res) => {
  try {
    const { status, transactionRef } = req.body;
    const update = { payoutStatus: status };
    if (status === 'paid') {
      update.lastPayoutRef = transactionRef || '';
      update.lastPayoutDate = new Date();
      // Get current balance to snapshot
      const vendor = await Restaurant.findById(req.params.id);
      if (vendor) {
        update.lastPayoutAmount = vendor.payoutBalance;
        update.payoutBalance = 0;
      }
    }

    const vendor = await Restaurant.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, data: vendor, message: `Payout ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== EXPORT ====================

export const exportFinanceCSV = async (req, res) => {
  try {
    const { Parser } = await import('json2csv');
    const vendors = await Restaurant.find({ status: 'active' }).lean();

    const flat = await Promise.all(vendors.map(async (v) => {
      const rate = v.commissionRate ?? DEFAULT_COMMISSION_RATE;
      const sales = await Order.aggregate([
        { $match: { restaurant: v._id, status: 'delivered' } },
        { $group: { _id: null, gross: { $sum: '$total_amount' } } },
      ]);
      const gross = sales[0]?.gross || 0;
      return {
        vendor: v.name,
        grossSales: gross,
        commissionRate: rate,
        commissionDeducted: gross * (rate / 100),
        netPayable: gross - gross * (rate / 100),
        payoutStatus: v.payoutStatus,
        lastPayoutDate: v.lastPayoutDate,
      };
    }));

    const parser = new Parser({ fields: Object.keys(flat[0] || {}) });
    const csv = parser.parse(flat.length ? flat : [{}]);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=finance.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
