import connectDb from "@/src/lib/db";
import emitEventhandler from "@/src/lib/emitEventhandler";
import Order from "@/src/models/order.model";
import User from "@/src/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const { userId, items, paymentMethod, totalAmount, address } = await req.json()
        if (!items || !userId || !paymentMethod || !totalAmount || !address) {
            return NextResponse.json({
                message: "Please send all credentials"
            }, { status: 400 })
        }
        const user = await User.findById(userId)
        if (!user) {
            return NextResponse.json({
                message: "user not found"
            }, { status: 400 })
        }

        const newOrder = await Order.create(
            {
                user: userId,
                items,
                paymentMethod,
                totalAmount,
                address
            }
        )
        await emitEventhandler("new-order",newOrder)
        return NextResponse.json(
            newOrder,
            { status: 201 })

    }
    catch (err) {
        return NextResponse.json({
            message: `place order error ${err}`
        }, { status: 500 })
    }
}