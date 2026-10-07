export const googleMapsUrl = (lat, lng) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export const formatCoord = (n) => Number(n).toFixed(5);