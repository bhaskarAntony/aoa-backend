// src/utils/pricingUtils.js

// Determine current booking phase
export const getBookingPhase = () => {
  const now = new Date();
  const year = 2026;

  const earlyBirdEnd = new Date(year, 7, 15);  // August 15, 2026
  const regularEnd = new Date(year, 9, 15);    // October 15, 2026

  if (now <= earlyBirdEnd) return 'EARLY_BIRD';
  if (now <= regularEnd) return 'REGULAR';
  return 'SPOT';
};

// Calculate pricing based on user role, registration type, and phase
export const calculatePrice = (userRole, registrationType, bookingPhase) => {
  let basePrice = 0;
  let workshopPrice = 0;
  let comboDiscount = 0;
  let totalWithoutGST = 0;
  let gst = 0;
  let totalAmount = 0;

  // Base Conference Only Price
  if (registrationType === 'CONFERENCE_ONLY') {
    basePrice = getConferencePrice(userRole, bookingPhase);
    totalWithoutGST = basePrice;
  }

  // Workshop + Conference Price (separate, not combo)
  if (registrationType === 'WORKSHOP_CONFERENCE') {
    basePrice = getConferencePrice(userRole, bookingPhase);
    workshopPrice = getWorkshopPrice(userRole, bookingPhase);
    totalWithoutGST = basePrice + workshopPrice;
  }

  // Combo (Conference + Workshop + Lifetime Membership)
  if (registrationType === 'COMBO') {
    totalWithoutGST = getComboPrice(userRole, bookingPhase);
  }

  // GST (18%) extra
  gst = Math.round(totalWithoutGST * 0.18);
  totalAmount = totalWithoutGST + gst;

  return {
    basePrice,
    workshopPrice,
    comboDiscount,
    totalWithoutGST,
    gst,
    totalAmount,
    bookingPhase,
  };
};

// Conference Only Prices (from table)
const getConferencePrice = (userRole, bookingPhase) => {
  const prices = {
    AOA: {
      EARLY_BIRD: 8000,
      REGULAR: 10000,
      SPOT: 13000,
    },
    NON_AOA: {
      EARLY_BIRD: 11000,
      REGULAR: 13000,
      SPOT: 16000,
    },
    PGS: {
      EARLY_BIRD: 7000,
      REGULAR: 9000,
      SPOT: 12000,
    },
  };

  return prices[userRole]?.[bookingPhase] || 0;
};

// Workshop + Conference Prices (from table)
const getWorkshopPrice = (userRole, bookingPhase) => {
  const prices = {
    AOA: {
      EARLY_BIRD: 10000,
      REGULAR: 12000,
      SPOT: 0, // Not available in Spot
    },
    NON_AOA: {
      EARLY_BIRD: 13000,
      REGULAR: 15000,
      SPOT: 0,
    },
    PGS: {
      EARLY_BIRD: 9000,
      REGULAR: 11000,
      SPOT: 0,
    },
  };

  return prices[userRole]?.[bookingPhase] || 0;
};

// Combo Prices (Conference + Workshop + Lifetime Membership) - from table
const getComboPrice = (userRole, bookingPhase) => {
  const prices = {
    AOA: {
      EARLY_BIRD: 0,    // Not available in Early Bird
      REGULAR: 0,
      SPOT: 0,
    },
    NON_AOA: {
      EARLY_BIRD: 16000,
      REGULAR: 18000,
      SPOT: 0, // Not available in Spot
    },
    PGS: {
      EARLY_BIRD: 12000,
      REGULAR: 14000,
      SPOT: 0,
    },
  };

  return prices[userRole]?.[bookingPhase] || 0;
};

// Role mapping for display
export const roleMap = {
  AOA: 'AOA Member',
  NON_AOA: 'Non-AOA Member',
  PGS: 'PGS & Fellows',
};

// Registration Type Display
export const registrationTypeDisplay = {
  CONFERENCE_ONLY: 'Conference Only',
  WORKSHOP_CONFERENCE: 'Workshop + Conference',
  COMBO: 'Combo (Conference + Workshop + Lifetime Membership)',
};