/**
 * API Helper for simulating network conditions.
 */

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getRandomDelay = (min = 500, max = 1200) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Simulates an API call with configurable network delay and failure rate.
 * @param {any} data - The mock data to resolve.
 * @param {number} failRate - Probability of throwing an error (from 0 to 1).
 * @param {string} errorMessage - Error message to throw on failure.
 */
export const mockRequest = async (data, failRate = 0, errorMessage = "Something went wrong. Please try again.") => {
  const ms = getRandomDelay();
  await delay(ms);

  if (Math.random() < failRate) {
    throw new Error(errorMessage);
  }

  // Deep clone data to simulate getting it fresh from an API response
  return JSON.parse(JSON.stringify(data));
};
