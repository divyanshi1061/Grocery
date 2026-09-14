import { auth } from "@/src/auth";
import connectDb from "@/src/lib/db";
import Order from "@/src/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();

    const orders = await Order.find({
      user: session?.user?.id,
    }).populate("user assignedDeliveryBoy").sort({createdAt:-1});

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `get all orders error:${error}` },
      { status: 500 }
    );
  }
}