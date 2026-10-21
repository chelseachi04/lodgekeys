import { STORAGE_KEYS } from './storageKeys';

export function generateBookingReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'LK-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function calculateStayPricing(nightlyRate, nights, roomsCount = 1, addOns = [], taxRatePct = 0) {
  const safeNights = Math.max(1, Number(nights) || 1);
  const safeRooms = Math.max(1, Number(roomsCount) || 1);
  const safeRate = Number(nightlyRate) || 0;

  const roomSubtotal = safeRate * safeNights * safeRooms;
  const addOnsTotal = (addOns || []).reduce((sum, a) => sum + (Number(a.priceNumeric || a.price) || 0), 0);
  const taxableAmount = roomSubtotal + addOnsTotal;
  const taxAmount = taxRatePct > 0 ? Math.round((taxableAmount * taxRatePct) / 100) : 0;
  const grandTotal = taxableAmount + taxAmount;

  return {
    nightlyRate: safeRate,
    nights: safeNights,
    roomsCount: safeRooms,
    roomSubtotal,
    addOnsTotal,
    taxRatePct,
    taxAmount,
    grandTotal,
  };
}

export const bookingService = {
  generateReference: generateBookingReference,
  calculatePricing: calculateStayPricing,

  getCustomerBookings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getManagerReservations(hotelSlug) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MANAGER_RESERVATIONS);
      const all = raw ? JSON.parse(raw) : [];
      if (!hotelSlug) return all;
      return all.filter((r) => !r.hotelSlug || r.hotelSlug === hotelSlug);
    } catch {
      return [];
    }
  },

  saveManagerReservations(reservations) {
    try {
      localStorage.setItem(STORAGE_KEYS.MANAGER_RESERVATIONS, JSON.stringify(reservations));
      window.dispatchEvent(new Event('storage'));
      return reservations;
    } catch (e) {
      console.error('Failed saving manager reservations', e);
      return reservations;
    }
  },

  updateReservationStatus(reservationId, newStatus) {
    const all = bookingService.getManagerReservations();
    const updated = all.map((r) => (r.id === reservationId ? { ...r, status: newStatus } : r));
    bookingService.saveManagerReservations(updated);
    return updated;
  },
};
