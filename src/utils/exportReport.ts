import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CustomerOrder, AdminSettings, AdminUser, ExpenseItem } from '../types';
import { formatRupiah, getAddOnLabel } from './storage';

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
  // Expense & Profit / Loss calculations
  totalExpenses?: number;
  capexExpenses?: number; // Belanja Modal (Investasi Alat/Mesin)
  opexExpenses?: number;  // Operasional, Bahan Baku, Gaji, Sewa
  netProfit?: number;     // completedRevenue - totalExpenses
  isProfitable?: boolean;
  profitMargin?: number;
}

export function exportFinancialToExcel(
  orders: CustomerOrder[],
  summary: FinancialSummaryData,
  settings: AdminSettings,
  adminUser?: AdminUser | null,
  expenses: ExpenseItem[] = []
) {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const totalExp = summary.totalExpenses ?? expenses.reduce((sum, e) => sum + e.amount, 0);
  const capexExp = summary.capexExpenses ?? expenses.filter(e => e.category === 'belanja_modal').reduce((sum, e) => sum + e.amount, 0);
  const opexExp = summary.opexExpenses ?? (totalExp - capexExp);
  const netProfit = summary.netProfit ?? (summary.completedRevenue - totalExp);
  const profitStatus = netProfit >= 0 ? 'SURPLUS / UNTUNG' : 'DEFISIT / RUGI';

  // AOA (Array of Arrays) for rich formatted layout
  const aoaData: (string | number | null)[][] = [
    [settings.storeName.toUpperCase()],
    ['LAPORAN KEUANGAN, PENGELUARAN & ANALISIS LABA RUGI'],
    [`Periode: ${summary.periodLabel}`],
    [`Dicetak Tanggal: ${dateStr} oleh ${adminUser?.name || 'Admin'} (${adminUser?.role || 'Staff'})`],
    [],
    ['=== RINGKASAN LABA / RUGI (PROFIT & LOSS) ==='],
    ['1. Total Omset Pemasukan (Pesanan Selesai / Lunas)', summary.completedRevenue],
    ['2. Total Pengeluaran Keseluruhan', totalExp],
    ['   - Belanja Modal (Investasi Alat/Mesin Workshop)', capexExp],
    ['   - Beban Operasional, Bahan Baku & Gaji', opexExp],
    ['3. HASIL AKHIR: LABA / RUGI BERSIH', netProfit],
    ['   Status Finansial Usaha', profitStatus],
    [],
    ['=== STATISTIK OPERASIONAL CUCI SEPATU ==='],
    ['Total Transaksi Pesanan', summary.totalOrdersCount],
    ['Pesanan Selesai / Lunas', summary.completedOrdersCount],
    ['Total Pasang Sepatu', summary.totalPairsCount],
    ['Rata-Rata Nilai Transaksi (AOV)', summary.averageOrderValue],
    ['Total Pendapatan Layanan Tambahan (Add-Ons)', summary.addOnsTotalRevenue],
    ['Total Pendapatan Ongkos Antar-Jemput', summary.deliveryFeesTotalRevenue],
    [],
    ['=== RINCIAN PER KATEGORI LAYANAN CUCI ==='],
    ['Layanan Cuci', 'Jumlah Pesanan', 'Total Pendapatan (Rp)']
  ];

  summary.serviceBreakdown.forEach((svc) => {
    aoaData.push([svc.name, svc.count, svc.revenue]);
  });

  // Table Pemasukan
  aoaData.push([]);
  aoaData.push(['=== RINCIAN TRANSAKSI PESANAN (PEMASUKAN) ===']);
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
    'Total Pembayaran (Rp)',
    'Status Pembayaran',
    'Status Pengerjaan',
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

    const addOnsStr = order.selectedAddOns?.length
      ? order.selectedAddOns.map(getAddOnLabel).join(', ')
      : '-';
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
      order.totalPrice,
      order.paymentStatus === 'sudah_bayar' ? 'Lunas' : 'Belum Bayar',
      order.status.replace(/_/g, ' ').toUpperCase(),
      order.adminNotes || '-'
    ]);
  });

  // Table Pengeluaran & Belanja Modal
  if (expenses && expenses.length > 0) {
    aoaData.push([]);
    aoaData.push(['=== RINCIAN BUKU PENGELUARAN & BELANJA MODAL ===']);
    aoaData.push([
      'No',
      'ID Pengeluaran',
      'Tanggal',
      'Uraian Pengeluaran',
      'Kategori',
      'Metode Bayar',
      'Nominal Biaya (Rp)',
      'Catatan / Supplier / No. Struk',
      'Dicatat Oleh'
    ]);

    expenses.forEach((exp, idx) => {
      const catLabel = {
        belanja_modal: 'Belanja Modal (Investasi Alat)',
        bahan_baku: 'Bahan Baku & Chemical Sabun',
        operasional: 'Operasional & Packaging',
        gaji: 'Gaji / Upah Karyawan',
        sewa: 'Sewa Tempat / Ruko',
        lainnya: 'Lain-lain'
      }[exp.category] || exp.category;

      aoaData.push([
        idx + 1,
        exp.id,
        exp.date,
        exp.title,
        catLabel,
        exp.paymentMethod.toUpperCase(),
        exp.amount,
        exp.notes || '-',
        exp.createdBy || 'Admin'
      ]);
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

  // Column width hints
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 16 }, // ID
    { wch: 18 }, // Tanggal
    { wch: 25 }, // Pelanggan / Uraian
    { wch: 16 }, // Phone / Kategori
    { wch: 20 }, // Layanan / Metode
    { wch: 8 },  // Pasang
    { wch: 30 }, // Sepatu / Catatan
    { wch: 16 }, // Metode
    { wch: 22 }, // Addons
    { wch: 16 }, // Biaya Layanan
    { wch: 16 }, // Biaya Addons
    { wch: 18 }, // Total
    { wch: 16 }, // Status Bayar
    { wch: 18 }, // Status Pengerjaan
    { wch: 25 }  // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laba Rugi & Keuangan');

  const safePeriod = summary.periodLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `Laporan_Laba_Rugi_Shoecare_Manokwari_${safePeriod}_${Date.now().toString().slice(-6)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportFinancialToPDF(
  orders: CustomerOrder[],
  summary: FinancialSummaryData,
  settings: AdminSettings,
  adminUser?: AdminUser | null,
  expenses: ExpenseItem[] = []
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

  const totalExp = summary.totalExpenses ?? expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = summary.netProfit ?? (summary.completedRevenue - totalExp);
  const isProfit = netProfit >= 0;

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
  doc.text('LAPORAN KEUANGAN, PENGELUARAN & ANALISIS LABA RUGI', 14, 18);
  doc.text(`Periode: ${summary.periodLabel}  |  Dicetak: ${dateStr}`, 14, 24);

  // Right side header info
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Petugas: ${adminUser?.name || 'Admin'} (${adminUser?.role || 'Staff'})`, pageWidth - 14, 14, { align: 'right' });
  doc.text(`WhatsApp: ${settings.adminPhone}`, pageWidth - 14, 20, { align: 'right' });

  // Summary KPI Cards in PDF (Row of 4 mini-boxes)
  const cardY = 32;
  const cardW = (pageWidth - 28 - 9) / 4;
  const cardH = 18;

  // Card 1: Pemasukan Realisasi
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('PEMASUKAN (LUNAS)', 18, cardY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(formatRupiah(summary.completedRevenue), 18, cardY + 12.5);

  // Card 2: Total Pengeluaran
  const card2X = 14 + cardW + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card2X, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PENGELUARAN', card2X + 4, cardY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(formatRupiah(totalExp), card2X + 4, cardY + 12.5);

  // Card 3: Laba / Rugi Bersih
  const card3X = card2X + cardW + 3;
  doc.setFillColor(isProfit ? 236 : 255, isProfit ? 253 : 241, isProfit ? 245 : 242);
  doc.roundedRect(card3X, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isProfit ? 4 : 159, isProfit ? 120 : 18, isProfit ? 87 : 57);
  doc.text(`HASIL: ${isProfit ? 'SURPLUS / UNTUNG' : 'DEFISIT / RUGI'}`, card3X + 4, cardY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(isProfit ? 5 : 225, isProfit ? 150 : 29, isProfit ? 105 : 72);
  doc.text(formatRupiah(netProfit), card3X + 4, cardY + 12.5);

  // Card 4: Volume Cuci
  const card4X = card3X + cardW + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card4X, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('VOLUME CUCI SEPATU', card4X + 4, cardY + 5.5);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${summary.completedOrdersCount} Selesai (${summary.totalPairsCount} Psg)`, card4X + 4, cardY + 12.5);

  // AutoTable: Transaksi Pesanan
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
      dibatalkan: 'Dibatalkan'
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
      formatRupiah(o.totalPrice),
      o.paymentStatus === 'sudah_bayar' ? 'Lunas' : 'Belum',
      statusLabel
    ];
  });

  autoTable(doc, {
    startY: 54,
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
      'Total',
      'Bayar',
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
      9: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 24 },
      10: { halign: 'center', cellWidth: 16 },
      11: { halign: 'center', cellWidth: 20 }
    },
    didDrawPage: (data) => {
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

  // If expenses exist, append expenses table
  if (expenses && expenses.length > 0) {
    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    
    if (finalY > 145) {
      doc.addPage();
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('DAFTAR PENGELUARAN & BELANJA MODAL', 14, 18);
      
      const expRows = expenses.map((e, idx) => [
        (idx + 1).toString(),
        e.date,
        e.title,
        e.category.replace('_', ' ').toUpperCase(),
        e.paymentMethod.toUpperCase(),
        formatRupiah(e.amount),
        e.notes || '-'
      ]);

      autoTable(doc, {
        startY: 22,
        head: [['No', 'Tanggal', 'Uraian Pengeluaran', 'Kategori', 'Metode', 'Nominal', 'Catatan/Supplier']],
        body: expRows,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { halign: 'center', cellWidth: 22 },
          2: { cellWidth: 65 },
          3: { cellWidth: 35 },
          4: { halign: 'center', cellWidth: 20 },
          5: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72], cellWidth: 30 },
          6: { cellWidth: 60 }
        }
      });
    } else {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('DAFTAR PENGELUARAN & BELANJA MODAL', 14, finalY + 12);

      const expRows = expenses.map((e, idx) => [
        (idx + 1).toString(),
        e.date,
        e.title,
        e.category.replace('_', ' ').toUpperCase(),
        e.paymentMethod.toUpperCase(),
        formatRupiah(e.amount),
        e.notes || '-'
      ]);

      autoTable(doc, {
        startY: finalY + 16,
        head: [['No', 'Tanggal', 'Uraian Pengeluaran', 'Kategori', 'Metode', 'Nominal', 'Catatan/Supplier']],
        body: expRows,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { halign: 'center', cellWidth: 22 },
          2: { cellWidth: 65 },
          3: { cellWidth: 35 },
          4: { halign: 'center', cellWidth: 20 },
          5: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72], cellWidth: 30 },
          6: { cellWidth: 60 }
        }
      });
    }
  }

  const safePeriod = summary.periodLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `Laporan_Laba_Rugi_Shoecare_Manokwari_${safePeriod}_${Date.now().toString().slice(-6)}.pdf`;
  doc.save(filename);
}
