// ============================================================
// API Route — Admin CSV Export (/api/admin/export/orders)
// ============================================================
// Exports all orders as a CSV file for financial reporting.
// Requires platform admin auth.
// ============================================================

import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const adminClerkId = await isAdmin();
  if (!adminClerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await db.order.findMany({
      select: {
        orderNumber: true,
        status: true,
        totalCents: true,
        buyerName: true,
        buyerPhone: true,
        buyerNote: true,
        deliveryAddress: true,
        deliveryCity: true,
        deliveryProvince: true,
        deliveryPostalCode: true,
        createdAt: true,
        updatedAt: true,
        shop: { select: { name: true } },
        items: {
          select: {
            productName: true,
            option1Value: true,
            option2Value: true,
            quantity: true,
            priceInCents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build CSV
    const headers = [
      "Order Number",
      "Status",
      "Total (ZAR)",
      "Items",
      "Shop",
      "Buyer Name",
      "Buyer Phone",
      "Buyer Note",
      "Delivery Address",
      "Created At",
      "Product Details",
    ];

    const rows = orders.map((o) => [
      o.orderNumber,
      o.status,
      (o.totalCents / 100).toFixed(2),
      o.items.length.toString(),
      o.shop.name,
      o.buyerName || "",
      o.buyerPhone || "",
      o.buyerNote || "",
      [o.deliveryAddress, o.deliveryCity, o.deliveryProvince, o.deliveryPostalCode].filter(Boolean).join(", "),
      o.createdAt.toISOString(),
      o.items
        .map(
          (i) =>
            `${i.productName}${i.option1Value ? ` (${i.option1Value}${i.option2Value ? `, ${i.option2Value}` : ""})` : ""} x${i.quantity} @ R${(i.priceInCents / 100).toFixed(2)}`
        )
        .join("; "),
    ]);

    function escapeCSV(val: string) {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("[ADMIN_EXPORT]", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
