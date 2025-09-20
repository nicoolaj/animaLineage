// Utility functions for JWT token management

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    return true; // If we can't parse the token, consider it expired
  }
};

export const getTokenPayload = (token: string): any => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    return null;
  }
};

export const getTokenExpirationTime = (token: string): number | null => {
  const payload = getTokenPayload(token);
  return payload?.exp ? payload.exp * 1000 : null; // Convert to milliseconds
};

export const shouldRefreshToken = (token: string, refreshThreshold: number = 300): boolean => {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return true;

  const currentTime = Date.now();
  const timeUntilExpiry = expirationTime - currentTime;

  // Refresh if token expires within the threshold (default 5 minutes)
  return timeUntilExpiry < refreshThreshold * 1000;
};