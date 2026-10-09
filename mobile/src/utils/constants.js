// API Configuration
export const API_URL = process.env.API_URL

// Colors - Deep Purple & Pink Theme
export const COLORS = {
  primary: '#6D28D9',      // Deep Purple
  secondary: '#DB2777',    // Vibrant Pink
  background: '#F9FAFB',   // Off-white
  cardBg: '#FFFFFF',       // White cards
  textPrimary: '#1F2937',  // Dark gray
  textSecondary: '#6B7280', // Medium gray
  border: '#E5E7EB',       // Light gray border
  success: '#10B981',      // Green
  danger: '#EF4444',       // Red
  warning: '#F59E0B',      // Orange
  sos: '#DC2626',          // Emergency red
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadow (Elevation 3)
export const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};
