import { Injectable } from '@angular/core';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

import { Order } from '../models/orders';

@Injectable({
    providedIn: 'root'
})
export class InvoiceService {
    constructor() { }

    private loadLogo(): Promise<HTMLImageElement> {

        return new Promise((resolve, reject) => {

            const img = new Image();

            img.src = 'assets/images/trianglepng.png';

            img.onload = () => resolve(img);

            img.onerror = reject;

        });

    }
    private async generateQRCode(text: string): Promise<string> {

        return await QRCode.toDataURL(text, {

            width: 180,

            margin: 1

        });

    }


    async generateInvoice(order: Order): Promise<void> {

        const logo = await this.loadLogo();

        const qrCode = await this.generateQRCode(
            `https://trianglesports.com/order/${order._id}`
        );

        const doc = new jsPDF({

            orientation: 'portrait',

            unit: 'mm',

            format: 'a4'

        });

        // Header
        this.drawHeader(doc, order, logo);

        // Bill To
        this.drawBillTo(doc, order);

        // Shipping
        this.drawShipping(doc, order);

        // Order Info
        this.drawOrderInfo(doc, order);

        // Products
        const tableY = this.drawProducts(doc, order);

        // Totals
        const totalY = this.drawTotals(doc, order, tableY);

        // Signature
        this.drawSignature(doc, totalY);

        // Footer
        this.drawFooter(doc, totalY, qrCode);

        doc.setProperties({

            title: 'Triangle Sports Invoice',

            subject: 'Tax Invoice',

            author: 'Triangle Sports',

            creator: 'Triangle Sports ERP'

        });

        doc.save(`invoice-${order._id}.pdf`);

    }
    // ==========================
    // HEADER
    // ==========================

    private drawHeader(
        doc: jsPDF,
        order: Order,
        logo: HTMLImageElement
    ): void {

        // Background

        doc.setFillColor(109, 40, 217);

        doc.rect(
            0,
            0,
            210,
            42,
            "F"
        );

        // Logo

        doc.addImage(
            logo,
            "PNG",
            12,
            8,
            20,
            20
        );

        // Company Name

        doc.setTextColor(255);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(20);

        doc.text(
            "Triangle Sports",
            38,
            16
        );

        // Company Details

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(9);

        doc.text(
            "Premium Sportswear Manufacturer",
            38,
            23
        );

        doc.text(
            "GSTIN : 07ABCDE1234F1Z5",
            38,
            29
        );

        doc.text(
            "www.trianglesports.com",
            38,
            35
        );

        // Invoice Title

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(20);

        doc.text(
            "TAX INVOICE",
            140,
            16
        );

        // Invoice Details

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(9);

        doc.text(
            `Invoice : INV-${order._id?.slice(-6)}`,
            140,
            24
        );

        doc.text(
            `Date : ${new Date(order.createdAt!).toLocaleDateString()}`,
            140,
            30
        );

        doc.text(
            `Payment : ${order.paymentStatus}`,
            140,
            36
        );

        // Reset Text Color

        doc.setTextColor(0);

    }

    // ==========================
    // BILL TO
    // ==========================

    private drawBillTo(
        doc: jsPDF,
        order: Order
    ): void {

        doc.setFillColor(248, 249, 252);

        doc.setDrawColor(225);

        doc.roundedRect(
            14,
            50,
            88,
            42,
            3,
            3,
            "FD"
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(11);

        doc.text(
            "BILL TO",
            18,
            58
        );

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(9);

        doc.text(
            order.customerName,
            18,
            68
        );

        doc.text(
            order.email,
            18,
            75
        );

        doc.text(
            order.phone,
            18,
            82
        );

    }


    // ==========================
    // SHIPPING ADDRESS
    // ==========================

    private drawShipping(
        doc: jsPDF,
        order: Order
    ): void {

        doc.setFillColor(248, 249, 252);

        doc.setDrawColor(225);

        doc.roundedRect(
            108,
            50,
            88,
            42,
            3,
            3,
            "FD"
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(11);

        doc.text(
            "SHIPPING ADDRESS",
            112,
            58
        );

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(9);

        const address = doc.splitTextToSize(
            order.address,
            75
        );

        doc.text(
            address,
            112,
            68
        );

        const nextY = 68 + (address.length * 5);

        doc.text(
            `${order.city}, ${order.state}`,
            112,
            nextY
        );

        doc.text(
            order.pincode,
            112,
            nextY + 6
        );

    }


    // ==========================
    // ORDER INFORMATION
    // ==========================

    private drawOrderInfo(
        doc: jsPDF,
        order: Order
    ): void {

        doc.setFillColor(248, 249, 252);

        doc.setDrawColor(225);

        doc.roundedRect(
            14,
            98,
            182,
            35,
            3,
            3,
            "FD"
        );

        // Heading

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(11);

        doc.text(
            "ORDER INFORMATION",
            18,
            108
        );

        // Labels

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(9);

        doc.text(
            "Order ID",
            18,
            118
        );

        doc.text(
            "Date",
            80,
            118
        );

        doc.text(
            "Payment",
            130,
            118
        );

        doc.text(
            "Status",
            18,
            128
        );

        // Values

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.text(
            order._id?.slice(-8) || "",
            18,
            123
        );

        doc.text(
            new Date(order.createdAt!).toLocaleDateString(),
            80,
            123
        );

        doc.text(
            order.paymentStatus || "",
            130,
            123
        );

        doc.text(
            order.orderStatus || "",
            18,
            133
        );

    }


    // ==========================
    // PRODUCTS TABLE
    // ==========================

    private drawProducts(
        doc: jsPDF,
        order: Order
    ): number {

        autoTable(doc, {

            startY: 142,

            theme: "grid",

            head: [[

                "Product",

                "Qty",

                "Price",

                "Total"

            ]],

            body: order.items.map(item => [

                item.name,

                item.quantity,

                `Rs. ${item.price.toFixed(2)}`,

                `Rs. ${(item.price * item.quantity).toFixed(2)}`

            ]),

            headStyles: {

                fillColor: [109, 40, 217],

                textColor: 255,

                fontStyle: "bold",

                halign: "center",

                fontSize: 10

            },

            styles: {

                fontSize: 9,

                cellPadding: 4,

                lineColor: [225, 225, 225],

                lineWidth: 0.2

            },

            alternateRowStyles: {

                fillColor: [248, 249, 252]

            },

            columnStyles: {

                0: {

                    cellWidth: 90

                },

                1: {

                    cellWidth: 20,

                    halign: "center"

                },

                2: {

                    cellWidth: 35,

                    halign: "right"

                },

                3: {

                    cellWidth: 35,

                    halign: "right"

                }

            }

        });
        doc.setTextColor(245);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(34);

        doc.text(
            "TRIANGLE SPORTS",
            35,
            185,
            {
                angle: 35
            }
        );

        doc.setTextColor(0);

        return (doc as any).lastAutoTable.finalY;

    }

    // ==========================
    // TOTALS
    // ==========================

    private drawTotals(
        doc: jsPDF,
        order: Order,
        tableY: number
    ): number {

        const subtotal = order.items.reduce(

            (sum, item) => sum + (item.price * item.quantity),

            0

        );

        const shipping = subtotal >= 1999 ? 0 : 99;

        const gst = Math.round(subtotal * 0.18);

        const grandTotal = order.total;

        const startY = tableY + 10;

        // Card

        doc.setFillColor(248, 249, 252);

        doc.setDrawColor(220);

        doc.roundedRect(

            120,

            startY,

            76,

            42,

            3,

            3,

            "FD"

        );

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(9);

        // Subtotal

        doc.text(
            "Subtotal",
            125,
            startY + 8
        );

        doc.text(
            `₹ ${subtotal.toFixed(2)}`,
            190,
            startY + 8,
            {
                align: "right"
            }
        );

        // Shipping

        doc.text(
            "Shipping",
            125,
            startY + 16
        );

        doc.text(
            shipping === 0 ? "FREE" : `₹ ${shipping.toFixed(2)}`,
            190,
            startY + 16,
            {
                align: "right"
            }
        );

        // GST

        doc.text(
            "GST (18%)",
            125,
            startY + 24
        );

        doc.text(
            `₹ ${gst.toFixed(2)}`,
            190,
            startY + 24,
            {
                align: "right"
            }
        );

        // Divider

        doc.setDrawColor(180);

        doc.line(

            125,

            startY + 28,

            190,

            startY + 28

        );

        // Grand Total

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(11);

        doc.text(
            "Grand Total",
            125,
            startY + 37
        );

        doc.text(
            `₹ ${grandTotal.toFixed(2)}`,
            190,
            startY + 37,
            {
                align: "right"
            }
        );

        return startY + 42;

    }


    // ==========================
    // SIGNATURE
    // ==========================

    private drawSignature(
        doc: jsPDF,
        y: number
    ): void {

        const signY = y + 15;

        doc.setDrawColor(180);

        doc.line(
            145,
            signY,
            190,
            signY
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(10);

        doc.text(
            "Triangle Sports",
            167,
            signY + 7,
            {
                align: "center"
            }
        );

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(9);

        doc.text(
            "Authorized Signature",
            167,
            signY + 13,
            {
                align: "center"
            }
        );

    }



    // ==========================
    // FOOTER
    // ==========================

    private drawFooter(
        doc: jsPDF,
        y: number,
        qrCode: string
    ): void {

        const footerY = y + 32;

        // Divider

        doc.setDrawColor(220);

        doc.line(
            14,
            footerY,
            196,
            footerY
        );

        // QR Code

        doc.addImage(
            qrCode,
            "PNG",
            14,
            footerY + 3,
            18,
            18
        );

        // QR Caption

        doc.setFontSize(7);

        doc.text(
            "Scan to Verify",
            23,
            footerY + 27,
            {
                align: "center"
            }
        );

        // Thank You

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(10);

        doc.text(
            "Thank you for shopping with Triangle Sports!",
            40,
            footerY + 10
        );

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(8);

        doc.text(
            "Goods once sold are subject to our return policy.",
            40,
            footerY + 17
        );

        doc.text(
            "support@trianglesports.com",
            40,
            footerY + 23
        );

        doc.text(
            "www.trianglesports.com",
            40,
            footerY + 29
        );

        // Right Side Note

        doc.setFont(
            "helvetica",
            "italic"
        );

        doc.setFontSize(8);

        doc.text(
            "Generated electronically. No signature required.",
            195,
            footerY + 29,
            {
                align: "right"
            }
        );

        doc.setFontSize(8);

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.text(
            "Page 1 of 1",
            195,
            290,
            {
                align: "right"
            }
        );

    }
}