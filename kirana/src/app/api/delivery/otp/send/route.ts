import connectDb from "@/src/lib/db";
import emitEventhandler from "@/src/lib/emitEventhandler";
import Order from "@/src/models/order.model";
import User from "@/src/models/user.model";
import { sendMail } from "@/src/lib/mailer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const { orderId } = await req.json()

        const order = await Order.findById(orderId).populate("user")
        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 })
        }

        // Generate a 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString()
        order.deliveryOtp = otp
        await order.save()

        const user = order.user as any

        // 1. Send OTP via email
        await sendMail(
            user.email,
            "Your Delivery OTP — Kirana",
            `<div style="font-family:sans-serif;max-width:480px;margin:auto">
              <h2 style="color:#ea580c">Your Delivery OTP</h2>
              <p>Your order <strong>#${orderId.toString().slice(-8).toUpperCase()}</strong> is about to be delivered.</p>
              <p>Share this OTP with the delivery partner to confirm receipt:</p>
              <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#1f2937;text-align:center;padding:20px;background:#f3f4f6;border-radius:12px;margin:20px 0">${otp}</div>
              <p style="color:#6b7280;font-size:13px">Do not share this OTP with anyone else.</p>
            </div>`
        )

        // 2. Notify user in real-time via socket (toast on track page)
        if (user?.socketId) {
            await emitEventhandler("delivery-otp-sent", {
                orderId: orderId.toString(),
                message: "Your delivery OTP has been sent to your email. Share it with the delivery partner."
            }, user.socketId)
        }

        return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 })
    } catch (error) {
        console.error("[send-otp] Error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}