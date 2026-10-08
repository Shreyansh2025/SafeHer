export const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

export const formatLocation = (item) => {
  const lat = item?.latitude;
  const lng = item?.longitude;
  if (lat == null || lng == null) return item?.address || 'Location unavailable';
  return item?.address ? `${item.address}\n${lat}, ${lng}` : `${lat}, ${lng}`;
};
