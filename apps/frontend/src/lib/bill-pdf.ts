/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Zivora — Bill PDF Generator (TypeScript Port)
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getPriceTierLabel, Variant } from './helpers';

export interface ShopSettings {
  shopName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  gstin?: string;
  upiId?: string;
  billTerms?: string;
}

export interface Customer {
  name: string;
  mobile?: string;
  email?: string;
}

export interface BillItem {
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Bill {
  billNumber: string;
  billDate: string | Date;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
}

export async function generateBillPDF(
  bill: Bill,
  items: BillItem[],
  shop: ShopSettings,
  customer: Customer | null,
  variantMap: Record<string, Variant>,
  productMap: Record<string, { name: string; productId?: string }>
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  let y = 14;

  // --- Header ---
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(shop.shopName || 'My Jewellery Shop', pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const addr = [
    shop.address1,
    shop.address2,
    [shop.city, shop.state, shop.pincode].filter(Boolean).join(', ')
  ].filter(Boolean);
  
  addr.forEach(line => {
    if (line) {
      doc.text(line, pageWidth / 2, y, { align: 'center' });
      y += 3.5;
    }
  });
  
  if (shop.phone) {
    doc.text(`Ph: ${shop.phone}`, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
  }
  if (shop.gstin) {
    doc.text(`GSTIN: ${shop.gstin}`, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
  }

  // --- Divider ---
  y += 2;
  doc.setDrawColor(180);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // --- Invoice Info ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${bill.billNumber}`, margin, y);
  doc.text(`Date: ${new Date(bill.billDate).toLocaleDateString('en-IN')}`, pageWidth - margin, y, { align: 'right' });
  y += 4;

  if (customer) {
    doc.text(`Customer: ${customer.name}${customer.mobile ? ' | ' + customer.mobile : ''}`, margin, y);
  } else {
    doc.text('Customer: Walk-in', margin, y);
  }
  y += 5;

  // --- Items Table ---
  const tableBody = items.map((item, i) => {
    const v = variantMap[item.variantId];
    const prod = v ? productMap[v.productId] : null;
    const label = v ? getPriceTierLabel(v.sellingPrice) : '';
    return [
      i + 1,
      `${prod?.name || '?'}\n${label}`,
      item.quantity,
      `Rs.${item.unitPrice.toLocaleString('en-IN')}`,
      `Rs.${item.totalPrice.toLocaleString('en-IN')}`,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Item', 'Qty', 'Rate', 'Amount']],
    body: tableBody,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [180, 180, 180],
      lineWidth: 0.1,
    },
    headStyles: {
      fontStyle: 'bold',
      fillColor: [240, 240, 240],
      textColor: [60, 60, 60],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // --- Totals ---
  const totalsX = pageWidth - margin;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const drawTotalLine = (label: string, value: string, bold = false) => {
    if (bold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    doc.text(label, totalsX - 35, y);
    doc.text(value, totalsX, y, { align: 'right' });
    y += 4;
  };

  drawTotalLine('Subtotal:', `Rs.${bill.subtotal.toLocaleString('en-IN')}`);

  const cgst = Math.round((bill.taxAmount / 2) * 100) / 100;
  drawTotalLine('CGST (1.5%):', `Rs.${cgst}`);
  drawTotalLine('SGST (1.5%):', `Rs.${cgst}`);

  if (bill.discountAmount > 0) {
    drawTotalLine('Discount:', `-Rs.${bill.discountAmount.toLocaleString('en-IN')}`);
  }

  y += 1;
  doc.setDrawColor(40);
  doc.setLineDashPattern([], 0);
  doc.line(totalsX - 45, y, totalsX, y);
  y += 4;

  doc.setFontSize(11);
  drawTotalLine('TOTAL:', `Rs.${bill.totalAmount.toLocaleString('en-IN')}`, true);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  drawTotalLine('Paid via:', bill.paymentMethod);

  // --- Footer ---
  y += 4;
  doc.setDrawColor(180);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const terms = (shop.billTerms || '').split('\n');
  terms.forEach(line => {
    doc.text(line, pageWidth / 2, y, { align: 'center' });
    y += 3;
  });

  // --- Save ---
  doc.save(`${bill.billNumber}.pdf`);
}
