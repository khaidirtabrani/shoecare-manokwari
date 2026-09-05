import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CustomerOrder, AdminSettings, AdminUser } from '../types';
import { formatRupiah } from './storage';

export interface FinancialSummaryData {
  periodLabel: string;
  totalRevenue: number;
  completedRevenue: number;
  inProgressRevenue: number;
  totalOrdersCount: number;
  completedOrdersCount: number;
  totalPairsCount: number;
  averageOrderValue: number;
  serviceBreakdown: { name: string; count: number; revenue: number }[];
  addOnsTotalRevenue: number;
  deliveryFeesTotalRevenue: number;
}

export function exportFinancialToExcel(
  orders: CustomerOrder[],
  summary: FinancialSummaryData,
  settings: AdminSettings,
  adminUser?: AdminUser | null
) {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // AOA (Array of Arrays) for rich formatted layout
  const aoaData: (string | number | null)[][] = [
    [settings.storeName.toUpperCase()],
    ['LAPORAN KEUANGAN & PENDAPATAN CUCI SEPATU'],
    [`Periode: ${summary.periodLabel}`],
    [`Dicetak Tanggal: ${dateStr} oleh ${adminUser?.name || 'Admin'} (${adminUser?.role || 'Staff'})`],
    [],
    ['RINGKASAN KEUANGAN'],
    ['Total Omset Kotor', summary.totalRevenue],
    ['Pendapatan Selesai / Lunas', summary.completedRevenue],
    ['Pendapatan Dalam Proses', summary.inProgressRevenue],
    ['Total Transaksi Pesanan', summary.totalOrdersCount],
    ['Total Pasang Sepatu', summary.totalPairsCount],
    ['Rata-Rata Nilai Transaksi', summary.averageOrderValue],
    ['Total Pendapatan Layanan Tambahan (Add-Ons)', summary.addOnsTotalRevenue],
    ['Total Pendapatan Ongkos Antar-Jemput', summary.deliveryFeesTotalRevenue],
    [],
    ['RINCIAN PER KATEGORI LAYANAN'],
    ['Layanan Cuci', 'Jumlah Pesanan', 'Total Pendapatan (Rp)']
  ];

  summary.serviceBreakdown.forEach((svc) => {
    aoaData.push([svc.name, svc.count, svc.revenue]);
  });

  aoaData.push([]);
  aoaData.push(['RINCIAN TRANSAKSI DETAIL']);
  aoaData.push([
    'No',
    'No. Resi / ID',
    'Tanggal Transaksi',
    'Nama Pelanggan',
    'No. WhatsApp',
    'Paket Layanan',
    'Pasang',
    'Detail Sepatu',
    'Metode Antar/Jemput',
    'Layanan Tambahan (Add-ons)',
    'Biaya Layanan (Rp)',
    'Biaya Add-ons (Rp)',
    'Ongkir (Rp)',
    'Total Pembayaran (Rp)',
    'Status Pesanan',
    'Catatan Admin'
  ]);

  orders.forEach((order, index) => {
    const orderDate = new Date(order.createdAt).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const shoeDetailsStr = order.shoeDetails
      .map((s) => `${s.brandModel || 'Sepatu'} (${s.shoeType})`)
      .join('; ');

    const addOnsStr = order.selectedAddOns?.length ? order.selectedAddOns.join(', ') : '-';
    const deliveryMethodStr = order.deliveryMethod === 'pickup' ? 'Antar-Jemput' : 'Antar Sendiri';

    aoaData.push([
      index + 1,
      order.id,
      orderDate,
      order.customerName,
      order.customerPhone,
      order.serviceName,
      order.pairCount,
      shoeDetailsStr,
      deliveryMethodStr,
      addOnsStr,
      order.servicePrice * order.pairCount,
      order.addOnsTotal,
      order.deliveryFee,
      order.totalPrice,
      order.status.replace(/_/g, ' ').toUpperCase(),
      order.adminNotes || '-'
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

  // Column width hints
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // ID
    { wch: 18 }, // Tanggal
    { wch: 22 }, // Pelanggan
    { wch: 16 }, // Phone
    { wch: 20 }, // Layanan
    { wch: 8 },  // Pasang
    { wch: 30 }, // Sepatu
    { wch: 16 }, // Metode
    { wch: 22 }, // Addons
    { wch: 16 }, // Biaya Layanan
    { wch: 16 }, // Biaya Addons
    { wch: 14 }, // Ongkir
    { wch: 18 }, // Total
    { wch: 20 }, // Status
    { wch: 25 }  // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Keuangan');

  const safePeriod = summary.periodLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `Laporan_Keuangan_Shoecare_Manokwari_${safePeriod}_${Date.now().toString().slice(-6)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportFinancialToPDF(
  orders: CustomerOrder[],
  summary: FinancialSummaryData,
  settings: AdminSettings,
  adminUser?: AdminUser | null
) {
  // A4 Landscape for financial table readability
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.storeName.toUpperCase(), 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('LAPORAN KEUANGAN, OMSET & ANALISIS TRANSAKSI', 14, 18);
  doc.text(`Periode: ${summary.periodLabel}  |  Dicetak: ${dateStr}`, 14, 24);

  // Right side header info
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Petugas: ${adminUser?.name || 'Admin'} (${adminUser?.role || 'Staff'})`, pageWidth - 14, 14, { align: 'right' });
  doc.text(`WhatsApp: ${settings.adminPhone}`, pageWidth - 14, 20, { align: 'right' });

  // Summary KPI Cards in PDF (Row of 4 mini-boxes)
  const cardY = 33;
  const cardW = (pageWidth - 28 - 9) / 4;
  const cardH = 18;

  // Card 1: Total Omset
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL OMSET KOTOR', 18, cardY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(formatRupiah(summary.totalRevenue), 18, cardY + 12.5);

  // Card 2: Pendapatan Selesai
  const card2X = 14 + cardW + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card2X, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('PENDAPATAN REALISASI (SELESAI)', card2X + 4, cardY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(summary.completedRevenue), card2X + 4, cardY + 12.5);

  // Card 3: Total Transaksi & Pasang
  const card3X = card2X + cardW + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card3X, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL TRANSAKSI / PASANG', card3X + 4, cardY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${summary.totalOrdersCount} Pesanan (${summary.totalPairsCount} Pasang)`, card3X + 4, cardY + 12.5);

  // Card 4: Rata-Rata Transaksi
  const card4X = card3X + cardW + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card4X, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('RATA-RATA ORDER (AOV)', card4X + 4, cardY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(summary.averageOrderValue), card4X + 4, cardY + 12.5);

  // AutoTable Data
  const tableRows = orders.map((o, idx) => {
    const formattedDate = new Date(o.createdAt).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });

    const statusLabel = {
      menunggu_konfirmasi: 'Menunggu',
      dijemput: 'Dijemput',
      dalam_proses: 'Proses',
      siap_ambil: 'Siap Ambil',
      selesai: 'Selesai',
      dibatalkan: 'Batal'
    }[o.status] || o.status;

    return [
      (idx + 1).toString(),
      o.id,
      formattedDate,
      o.customerName,
      o.serviceName,
      `${o.pairCount} psg`,
      o.deliveryMethod === 'pickup' ? 'Jemput' : 'Drop-off',
      formatRupiah(o.servicePrice * o.pairCount),
      o.addOnsTotal > 0 ? formatRupiah(o.addOnsTotal) : '-',
      o.deliveryFee > 0 ? formatRupiah(o.deliveryFee) : '-',
      formatRupiah(o.totalPrice),
      statusLabel
    ];
  });

  autoTable(doc, {
    startY: 56,
    head: [[
      'No',
      'No. Resi',
      'Tanggal',
      'Pelanggan',
      'Layanan',
      'Jumlah',
      'Metode',
      'Biaya Cuci',
      'Add-ons',
      'Ongkir',
      'Total (Rp)',
      'Status'
    ]],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240]
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 18 },
      2: { halign: 'center', cellWidth: 16 },
      3: { cellWidth: 32 },
      4: { cellWidth: 26 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 16 },
      7: { halign: 'right', cellWidth: 22 },
      8: { halign: 'right', cellWidth: 18 },
      9: { halign: 'right', cellWidth: 16 },
      10: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 26 },
      11: { halign: 'center', cellWidth: 20 }
    },
    didDrawPage: (data) => {
      // Footer page number
      const pageCount = doc.getNumberOfPages();
      const currentPage = data.pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${currentPage} dari ${pageCount} - Dokumen Rahasia ${settings.storeName}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 7,
        { align: 'center' }
      );
    }
  });

  // Safe filename
  const safePeriod = summary.periodLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `Laporan_Keuangan_Shoecare_Manokwari_${safePeriod}_${Date.now().toString().slice(-6)}.pdf`;
  doc.save(filename);
}
