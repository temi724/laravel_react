// Contact, pickup and payment details. The values come from config/store.php
// through window.MurphylogStore (see partials/store-scripts.blade.php).
const fallback = {
  name: 'Murphylog Global',
  legal_name: 'Murphylog Global Concept',
  phone: '+2348024913553',
  phone_display: '0802 491 3553',
  whatsapp: '2348024913553',
  whatsapp_display: '+234 802 491 3553',
  address: { line: '12, Ola Ayeni Street', area: 'Ikeja, Lagos State, Nigeria' },
  hours: 'Mon to Sat, 9:00 AM to 6:30 PM',
  email: 'info@murphylogglobal.com',
  website: 'murphylog.com.ng',
  delivery: 'All states in Nigeria',
  bank: { account_name: 'Murphylog Global Concept', bank_name: 'Providus Bank', account_number: '5401799184' },
};

const store = () => ({ ...fallback, ...(typeof window !== 'undefined' ? window.MurphylogStore : null) });

export default store;
