import { create } from 'zustand';

const EMPTY = { now: null, deal_of_day: null, drops: [], bundles: [], prices: {}, holds: {} };

// What the page was rendered with (partials/store-scripts.blade.php), so nothing flashes in
const initial = () => ({ ...EMPTY, ...(typeof window !== 'undefined' && window.MurphylogOffers ? window.MurphylogOffers : {}) });

// How far this device's clock is from the server's. Countdowns use the server's time,
// so a phone with the wrong time still shows the right countdown.
const offsetFrom = (data) => (data.now ? new Date(data.now).getTime() - Date.now() : 0);

// The deal of the day, drops and bundles running now. One store for every component on the page.
const useOffersStore = create((set, get) => ({
  data: initial(),
  clockOffset: offsetFrom(initial()),
  refreshing: false,

  // Ask the server again: after a countdown reaches zero, a drop goes live or a deal ends
  refresh: async () => {
    if (get().refreshing) return;
    set({ refreshing: true });
    try {
      const response = await fetch('/api/offers', { headers: { Accept: 'application/json' } });
      if (response.ok) {
        const data = { ...EMPTY, ...(await response.json()) };
        set({ data, clockOffset: offsetFrom(data) });
      }
    } catch (error) {
      console.error('Could not refresh offers:', error);
    } finally {
      set({ refreshing: false });
    }
  },
}));

// The current time by the server's clock, in milliseconds
export const serverNow = () => Date.now() + useOffersStore.getState().clockOffset;

export default useOffersStore;
