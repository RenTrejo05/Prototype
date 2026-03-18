import { NextResponse } from "next/server";

import { SAT_PRODUCT_CATEGORIES } from "@/lib/sat-product-categories";

export async function GET() {
  return NextResponse.json({
    source: "SAT",
    categories: SAT_PRODUCT_CATEGORIES,
  });
}
