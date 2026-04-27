import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';

// ==================== PRODUCTS ====================

// @desc    Get all products across vendors
// @route   GET /api/admin/products
export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, restaurant = '', category = '', approvalStatus = '' } = req.query;
    const query = {};
    if (restaurant) query.restaurant = restaurant;
    if (category) query.category = category;
    if (approvalStatus) query.approvalStatus = approvalStatus;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'restaurant', select: 'name' },
        { path: 'category', select: 'name' },
      ],
      sort: { createdAt: -1 },
    };

    const products = await MenuItem.paginate(query, options);
    res.json({ success: true, data: products.docs, pagination: { total: products.totalDocs, page: products.page, pages: products.totalPages } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve product
// @route   PUT /api/admin/products/:id/approve
export const approveProduct = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, { approvalStatus: 'approved' }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: item, message: 'Product approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject product
// @route   PUT /api/admin/products/:id/reject
export const rejectProduct = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, { approvalStatus: 'rejected' }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: item, message: 'Product rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Force remove product
// @route   DELETE /api/admin/products/:id
export const removeProduct = async (req, res) => {
  try {
    const { reason } = req.body;
    const item = await MenuItem.findByIdAndUpdate(req.params.id, { isAvailable: false, removalReason: reason || 'Removed by admin' }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle featured
// @route   PUT /api/admin/products/:id/featured
export const toggleFeatured = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Product not found' });
    item.isFeatured = !item.isFeatured;
    await item.save();
    res.json({ success: true, data: item, message: `Product ${item.isFeatured ? 'featured' : 'unfeatured'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CATEGORIES (using existing Category model) ====================

// Get global categories (restaurant = null, parentCategory = null)
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ restaurant: null, parentCategory: null }).sort({ sortOrder: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const data = { ...req.body, restaurant: null, parentCategory: null };
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }
    const category = await Category.create(data);
    res.status(201).json({ success: true, data: category, message: 'Category created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }
    const category = await Category.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: category, message: 'Category updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    // Also delete subcategories
    await Category.deleteMany({ parentCategory: req.params.id });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SUBCATEGORIES (Category with parentCategory set) ====================

export const getSubcategories = async (req, res) => {
  try {
    const query = { parentCategory: { $ne: null } };
    if (req.query.parentCategory) query.parentCategory = req.query.parentCategory;
    const subs = await Category.find(query).populate('parentCategory', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data: subs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubcategory = async (req, res) => {
  try {
    const data = { ...req.body, restaurant: null };
    const sub = await Category.create(data);
    res.status(201).json({ success: true, data: sub, message: 'Subcategory created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubcategory = async (req, res) => {
  try {
    const sub = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!sub) return res.status(404).json({ success: false, message: 'Subcategory not found' });
    res.json({ success: true, data: sub, message: 'Subcategory updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubcategory = async (req, res) => {
  try {
    const sub = await Category.findByIdAndDelete(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subcategory not found' });
    res.json({ success: true, message: 'Subcategory deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== REVIEWS ====================

export const removeReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
