import type { SupermarketCatalogItem } from '../types';

export const SUPERMARKET_CATALOG: SupermarketCatalogItem[] = [
  {
    barcode: '8998866200213',
    name: 'Indomie Goreng Spesial',
    category: 'Makanan instan',
    unit: 'bungkus',
    unitPrice: 3100,
    brand: 'Indomie',
    description: 'Mie instan goreng favorit mahasiswa',
  },
  {
    barcode: '8998866200220',
    name: 'Indomie Kuah Rasa Soto Mie',
    category: 'Makanan instan',
    unit: 'bungkus',
    unitPrice: 3000,
    brand: 'Indomie',
    description: 'Mie instan kuah soto gurih segar',
  },
  {
    barcode: '8992753112104',
    name: 'Susu Ultra Milk UHT Full Cream 1L',
    category: 'Susu dan produk dingin',
    unit: 'botol',
    unitPrice: 20500,
    discounts: [5], // promo 5%
    brand: 'Ultra Milk',
    description: 'Susu UHT segar berkualitas',
  },
  {
    barcode: '8992753111107',
    name: 'Susu Ultra Milk Cokelat 250ml',
    category: 'Susu dan produk dingin',
    unit: 'kotak',
    unitPrice: 6500,
    brand: 'Ultra Milk',
    description: 'Susu UHT rasa cokelat kaya kalsium',
  },
  {
    barcode: '8991234567890',
    name: 'Beras Pandan Wangi Super 5kg',
    category: 'Beras dan bahan pokok',
    unit: 'pack',
    unitPrice: 75000,
    brand: 'Pandan Wangi',
    description: 'Beras pulen wangi kualitas super',
  },
  {
    barcode: '8992388123456',
    name: 'Minyak Goreng Sania Pouch 2L',
    category: 'Beras dan bahan pokok',
    unit: 'pack',
    unitPrice: 37500,
    brand: 'Sania',
    description: 'Minyak goreng kelapa sawit jernih',
  },
  {
    barcode: '8999999000011',
    name: 'Telur Ayam Negeri Fresh 1kg',
    category: 'Daging dan protein',
    unit: 'kg',
    unitPrice: 28000,
    brand: 'Fresh Farm',
    description: 'Telur ayam segar sumber protein rantau',
  },
  {
    barcode: '8992772000010',
    name: 'Aqua Air Mineral 600ml',
    category: 'Minuman',
    unit: 'botol',
    unitPrice: 3500,
    brand: 'Aqua',
    description: 'Air mineral pegunungan alami',
  },
  {
    barcode: '8992772000027',
    name: 'Aqua Air Mineral Galon Mini 1.5L',
    category: 'Minuman',
    unit: 'botol',
    unitPrice: 6500,
    brand: 'Aqua',
    description: 'Air mineral kemasan besar praktis',
  },
  {
    barcode: '8991001123456',
    name: 'SilverQueen Milk Chocolate Cashew 58g',
    category: 'Makanan instan',
    unit: 'pcs',
    unitPrice: 16500,
    discounts: [10],
    brand: 'SilverQueen',
    description: 'Cokelat kacang mede favorit camilan',
  },
  {
    barcode: '8999999555555',
    name: 'Sabun Cair Lifebuoy Total 10 450ml',
    category: 'Perlengkapan mandi',
    unit: 'botol',
    unitPrice: 24000,
    brand: 'Lifebuoy',
    description: 'Sabun antibakterial perlindungan kuman',
  },
  {
    barcode: '8999999777777',
    name: 'Shampoo Pantene Anti Ketombe 160ml',
    category: 'Perlengkapan mandi',
    unit: 'botol',
    unitPrice: 26000,
    brand: 'Pantene',
    description: 'Perawatan rambut bersih dan segar',
  },
  {
    barcode: '8999999888888',
    name: 'Sunlight Pencuci Piring Jeruk Nipis 650ml',
    category: 'Kebersihan rumah',
    unit: 'pack',
    unitPrice: 14500,
    brand: 'Sunlight',
    description: 'Sabun cuci piring pembersih lemak cepat',
  },
  {
    barcode: '8998001000019',
    name: 'Sari Roti Tawar Spesial 370g',
    category: 'Makanan instan',
    unit: 'bungkus',
    unitPrice: 15000,
    brand: 'Sari Roti',
    description: 'Roti tawar lembut untuk sarapan kuliah',
  },
  {
    barcode: '8993001000025',
    name: 'So Good Chicken Nugget 400g',
    category: 'Daging dan protein',
    unit: 'pack',
    unitPrice: 42000,
    discounts: [15],
    brand: 'So Good',
    description: 'Nugget ayam lezat siap goreng praktis',
  },
  {
    barcode: '8991002000032',
    name: 'Good Day Cappuccino Botol 250ml',
    category: 'Minuman',
    unit: 'botol',
    unitPrice: 7000,
    brand: 'Good Day',
    description: 'Kopi susu cappuccino penyemangat tugas',
  },
  {
    barcode: '8992741000055',
    name: 'Paseo Facial Tissue Soft Pack 250s',
    category: 'Perlengkapan mandi',
    unit: 'pack',
    unitPrice: 13500,
    brand: 'Paseo',
    description: 'Tisu wajah lembut higienis',
  },
];

export function findProductByBarcode(barcode: string): SupermarketCatalogItem | undefined {
  const cleaned = barcode.trim();
  return SUPERMARKET_CATALOG.find(
    (item) => item.barcode === cleaned || item.barcode.slice(-6) === cleaned.slice(-6)
  );
}

export function searchCatalogProducts(query: string): SupermarketCatalogItem[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return SUPERMARKET_CATALOG.slice(0, 8);
  return SUPERMARKET_CATALOG.filter(
    (item) =>
      item.name.toLowerCase().includes(lower) ||
      item.brand?.toLowerCase().includes(lower) ||
      item.barcode.includes(lower)
  );
}
