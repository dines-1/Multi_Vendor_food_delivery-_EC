const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:5000';

export const fallbackFoodImage =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=900';

export const fallbackRestaurantImage =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=900';

export const getDocs = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.docs)) return payload.docs;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.docs)) return payload.data.docs;
  return [];
};

export const getEntity = (payload) => payload?.data || payload || null;

export const resolveMediaUrl = (value, fallback) => {
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/uploads')) return `${BACKEND_ORIGIN}${value}`;
  return value;
};

export const getCategoryName = (category) => {
  if (!category) return 'Uncategorized';
  if (typeof category === 'string') return category;
  return category.name || 'Uncategorized';
};

export const normalizeRestaurant = (restaurant = {}) => ({
  ...restaurant,
  id: restaurant._id,
  name: restaurant.name || 'Restaurant',
  image: resolveMediaUrl(restaurant.logo_url, fallbackRestaurantImage),
  rating: Number(restaurant.rating || 0),
  totalReviews: restaurant.totalReviews || 0,
  cuisines: Array.isArray(restaurant.cuisines) ? restaurant.cuisines : [],
  area: restaurant.address?.area || restaurant.address?.city || 'Kathmandu',
  hours: restaurant.openTime && restaurant.closeTime ? `${restaurant.openTime} - ${restaurant.closeTime}` : 'Open today',
});

export const normalizeMenuItem = (item = {}) => {
  const restaurant = item.restaurant && typeof item.restaurant === 'object'
    ? normalizeRestaurant(item.restaurant)
    : item.restaurant;

  return {
    ...item,
    id: item._id,
    name: item.name || 'Menu item',
    image: resolveMediaUrl(item.image_url || item.image, fallbackFoodImage),
    categoryName: getCategoryName(item.category),
    restaurant,
    restaurantId: typeof item.restaurant === 'object' ? item.restaurant?._id : item.restaurant,
    restaurantName: typeof item.restaurant === 'object' ? item.restaurant?.name : 'Local Kitchen',
    price: Number(item.price || 0),
    preparationTime: item.preparationTime || 25,
    description: item.description || 'Freshly prepared with quality ingredients.',
  };
};
