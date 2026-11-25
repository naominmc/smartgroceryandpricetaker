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
  {
    id: 'visa',
    name: 'Visa Card',
    type: 'card',
    accountNumber: '•••• •••• •••• 4242',
    color: '#1A1F71',
    badge: '💳 Visa',
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    type: 'card',
    accountNumber: '•••• •••• •••• 5412',
    color: '#EB001B',
    badge: '💳 Mastercard',
  },
  {
    id: 'alipay',
    name: 'Alipay (支付宝)',
    type: 'ewallet',
    accountNumber: 'International / QR Pay',
    color: '#1677FF',
    badge: '🌐 Alipay',
  },
];

export const DEFAULT_PAYMENT_ACCOUNT = PAYMENT_ACCOUNTS[0]; // Bank BCA

export const getShortPaymentName = (method: string, lang: string = 'id'): string => {
  if (!method) return 'BCA';
  if (method.includes('Alipay')) return 'Alipay';
  if (method.includes('Visa')) return 'VISA';
  if (method.includes('Mastercard')) return 'MC';
  if (method.includes('GoPay') || method.includes('QRIS')) return 'GoPay';
  if (method.includes('Mandiri')) return 'Mandiri';
  if (method.includes('Blu')) return 'Blu BCA';
  if (method.includes('Tunai') || method.includes('Cash')) {
    return lang === 'zh' ? '现金' : lang === 'en' ? 'Cash' : 'Tunai';
  }
  if (method.includes('BCA')) return 'BCA';
  return method.replace('Bank ', '').split(' ')[0] || 'Bank';
};

