export const getBookingPhase = () => {
  const now = new Date();
  const year = 2026;
  
  const earlyBirdEnd = new Date(year, 7, 15); // August 15
  const regularEnd = new Date(year, 9, 15);   // October 15
  
  if (now <= earlyBirdEnd) {
    return 'EARLY_BIRD';
  } else if (now <= regularEnd) {
    return 'REGULAR';
  } else {
    return 'SPOT';
  }
};

export const calculatePrice = (userRole, registrationType, bookingPhase) => {
  const basePrice = getBasePrice(userRole, bookingPhase);
  let workshopPrice = 0;
  let comboDiscount = 0;
  
  if (registrationType === 'WORKSHOP_CONFERENCE' || registrationType === 'COMBO') {
    workshopPrice = getWorkshopPrice(userRole, bookingPhase);
  }
  
  if (registrationType === 'COMBO') {
    comboDiscount = 500; // Flat discount for combo
  }
  
  const subtotal = basePrice + workshopPrice - comboDiscount;
  const gst = Math.round(subtotal * 0.18); // 18% GST
  const totalAmount = subtotal + gst;
  
  return {
    basePrice,
    workshopPrice,
    comboDiscount,
    gst,
    totalAmount
  };
};

const getBasePrice = (userRole, bookingPhase) => {
  const prices = {
    AOA: {
      EARLY_BIRD: 2500,
      REGULAR: 3000,
      SPOT: 3500
    },
    NON_AOA: {
      EARLY_BIRD: 3500,
      REGULAR: 4000,
      SPOT: 4500
    },
    PGS: {
      EARLY_BIRD: 1500,
      REGULAR: 2000,
      SPOT: 2500
    }
  };
  
  return prices[userRole][bookingPhase];
};

const getWorkshopPrice = (userRole, bookingPhase) => {
  const prices = {
    AOA: {
      EARLY_BIRD: 1000,
      REGULAR: 1200,
      SPOT: 1500
    },
    NON_AOA: {
      EARLY_BIRD: 1200,
      REGULAR: 1500,
      SPOT: 1800
    },
    PGS: {
      EARLY_BIRD: 800,
      REGULAR: 1000,
      SPOT: 1200
    }
  };
  
  return prices[userRole][bookingPhase];
};