/**
 * Validates if a string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid URL, false otherwise
 */
export const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

/**
 * Validates bookmark title
 * @param {string} title - The title to validate
 * @returns {boolean} - True if valid title, false otherwise
 */
export const isValidTitle = (title) => {
  if (!title) return false;
  const trimmed = title.trim();
  return trimmed.length > 0 && trimmed.length <= 255;
};

/**
 * Validates UUID format
 * @param {string} uuid - The UUID to validate
 * @returns {boolean} - True if valid UUID, false otherwise
 */
export const isValidUUID = (uuid) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
