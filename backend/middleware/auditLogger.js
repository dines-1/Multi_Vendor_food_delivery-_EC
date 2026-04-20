import AuditLog from '../models/AuditLog.js';

export const logAction = (action, target = '') => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Log only successful actions
      if (data && data.success) {
        AuditLog.create({
          actor: req.user?._id,
          action,
          target,
          targetId: req.params?.id || '',
          details: JSON.stringify(req.body || {}),
          ipAddress: req.ip || req.connection?.remoteAddress || '',
        }).catch((err) => console.error('Audit log error:', err));
      }
      return originalJson(data);
    };
    next();
  };
};
