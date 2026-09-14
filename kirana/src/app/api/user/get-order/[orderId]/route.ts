import connectDb from "@/src/lib/db";
import Order from "@/src/models/order.model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        await connectDb();
        const { orderId } = await params;

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
        }

        const order = await Order.findById(orderId).populate("assignedDeliveryBoy");
        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }
        return NextResponse.json(order, { status: 200 });
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}
