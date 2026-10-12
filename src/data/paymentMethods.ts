import type { PaymentAccount } from '../types';

export const PAYMENT_ACCOUNTS: PaymentAccount[] = [
  {
    id: 'bca',
    name: 'Bank BCA',
    type: 'bank',
    accountNumber: '5271-8892-01 (naomiiracle)',
    color: '#005EAA',
    badge: '🔵 Bank BCA (Utama)',
  },
  {
    id: 'blu_bca',
    name: 'Blu by BCA Digital',
    type: 'bank',
    accountNumber: '0812-9988-7766',
    color: '#00A3E0',
    badge: '🔷 Blu BCA',
  },
  {
    id: 'cash',
    name: 'Dompet Tunai / Cash',
    type: 'cash',
    accountNumber: 'Uang Fisik di Dompet',
    color: '#16A34A',
    badge: '💵 Tunai',
  },
  {
    id: 'gopay',
    name: 'GoPay / QRIS',
    type: 'ewallet',
    accountNumber: '0812-****-4512',
    color: '#00AED6',
    badge: '📱 QRIS / GoPay',
  },
  {
    id: 'mandiri',
    name: 'Bank Mandiri (Livin)',
    type: 'bank',
    accountNumber: '1370-0199-2811',
    color: '#003D79',
    badge: '🟡 Mandiri',
  },
];

export const DEFAULT_PAYMENT_ACCOUNT = PAYMENT_ACCOUNTS[0]; // Bank BCA
