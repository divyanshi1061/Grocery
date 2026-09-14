import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/src/lib/db";
import emitEventhandler from "@/src/lib/emitEventhandler";
import Order from "@/src/models/order.model";
import DeliveryAssignment from "@/src/models/deliveryAssignment.model";

export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const { orderId, otp } = await req.json()

        if (!orderId || !otp) {
            return NextResponse.json({ message: "orderId and otp are required" }, { status: 400 })
        }

        const order = await Order.findById(orderId).populate("user")
        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 })
        }

        // Validate OTP
        if (order.deliveryOtp !== otp.trim()) {
            return NextResponse.json({ message: "Invalid OTP. Please try again." }, { status: 400 })
        }

        // Mark order as delivered
        order.status = "delivered"
        order.deliveryOtpVerification = true
        await order.save()

        // ✅ FIX: use field name "order" (not "orderId") — matches the schema
        await DeliveryAssignment.updateOne(
            { order: orderId },
            { $set: { status: "completed" } }
        )

        const user = order.user as any

        // Notify user in real-time: order is delivered
        if (user?.socketId) {
            await emitEventhandler(
                "order-status-update",
                { orderId: order._id.toString(), status: "delivered" },
                user.socketId
            )
            await emitEventhandler(
                "delivery-completed",
                { orderId: order._id.toString() },
                user.socketId
            )
        }

        return NextResponse.json({ message: "Delivery successfully completed" }, { status: 200 })
    } catch (error) {
        console.error("[verify-otp] Error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}