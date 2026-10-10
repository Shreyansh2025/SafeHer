// API Configuration
export const API_URL =
  "https://safeher-ji7r.onrender.com/api";

// Colors - Deep Purple & Pink Theme
export const COLORS = {
  primary: '#4C2469',      // Plum
  secondary: '#C2336F',    // Rose pink
  background: '#FFF8FC',   // Soft blush
  cardBg: '#FFFFFF',       // White cards
  textPrimary: '#3D205A',  // Deep plum text
  textSecondary: '#75627F', // Muted plum-grey
  border: '#F1D9EA',       // Soft pink border
  softPink: '#F2DCEC',     // Soft pink surface
  mutedIcon: '#9A8AA5',    // Inactive icons
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
  md: 14,
  lg: 20,
  xl: 24,
  full: 9999,
};

// Shadow (Elevation 3)
export const SHADOW = {
  shadowColor: '#311446',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 3,
};

// Fonts (loaded in App.js with useFonts)
export const FONTS = {
  heading: 'Poppins_600SemiBold',
  headingBold: 'Poppins_700Bold',
  body: 'Nunito_400Regular',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
};

// Image assets
export const IMAGES = {
  logo: require('../../assets/images/safeher-logo.png'),
  background: require('../../assets/images/safeher-background.png'),
  splash: require('../../assets/images/safeher-splash-floral-background.png'),
  homeBackground: require('../../assets/images/safeher-home-background.png'),
  homeBanner: require('../../assets/images/safeher-home-banner.png'),
  cardBackground: require('../../assets/images/safeher-card-background.png'),
  communityBanner: require('../../assets/images/safeher-community-banner.png'),
  communityIllustration: require('../../assets/images/safeher-community-illustration.png'),
  safety: require('../../assets/images/safeher-safety-illustration.png'),
  protection: require('../../assets/images/safeher-protection-illustration.png'),
  support: require('../../assets/images/safeher-support-illustration.png'),
  iconPhone: require('../../assets/images/safeher-icon-phone.png'),
  iconLocation: require('../../assets/images/safeher-icon-location.png'),
  iconShield: require('../../assets/images/safeher-icon-shield.png'),
  iconCommunity: require('../../assets/images/safeher-icon-community.png'),
  iconHeart: require('../../assets/images/safeher-icon-heart.png'),
  iconChat: require('../../assets/images/safeher-icon-chat.png'),
};
