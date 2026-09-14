import { auth } from "@/src/auth";
import connectDb from "@/src/lib/db";
import emitEventhandler from "@/src/lib/emitEventhandler";
import DeliveryAssignment from "@/src/models/deliveryAssignment.model";
import Order from "@/src/models/order.model";
import User from "@/src/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDb()
        const { id } = await params
        const session = await auth()
        const deliveryBoyId = session?.user?.id

        if (!deliveryBoyId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const assignment = await DeliveryAssignment.findById(id)
        if (!assignment) {
            return NextResponse.json({ message: "Assignment not found" }, { status: 404 })
        }
        if (assignment.status !== "brodcasted") {
            return NextResponse.json({ message: "Assignment already taken or expired" }, { status: 400 })
        }

        // Check if this delivery boy already has an active assignment
        const alreadyAssigned = await DeliveryAssignment.findOne({
            assignedTo: deliveryBoyId,
            status: { $nin: ["brodcasted", "completed"] }
        })
        if (alreadyAssigned) {
            return NextResponse.json({ message: "You already have an active delivery" }, { status: 400 })
        }

        // Accept the assignment
        assignment.assignedTo = deliveryBoyId
        assignment.status = "assigned"
        assignment.acceptedAt = new Date()
        await assignment.save()

        // Update the order with the assigned delivery boy
        const order = await Order.findById(assignment.order).populate("user")
        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 })
        }
        order.assignedDeliveryBoy = deliveryBoyId
        await order.save()

        // Remove this delivery boy from other broadcasted assignments
        await DeliveryAssignment.updateMany(
            { _id: { $ne: assignment._id }, brodcastedTo: deliveryBoyId, status: "brodcasted" },
            { $pull: { brodcastedTo: deliveryBoyId } }
        )

        // Notify the user in real-time via socket
        const user = order.user as any
        if (user?.socketId) {
            // Update their tracking page status
            await emitEventhandler("order-status-update", { orderId: order._id, status: order.status }, user.socketId)

            // Send delivery partner details so the card appears immediately
            const deliveryBoy = await User.findById(deliveryBoyId).select("name mobile")
            await emitEventhandler("delivery-partner-assigned", {
                orderId: order._id.toString(),
                deliveryBoy: {
                    _id: deliveryBoyId,
                    name: deliveryBoy?.name,
                    mobile: deliveryBoy?.mobile,
                }
            }, user.socketId)
        }

        return NextResponse.json({ message: "Order accepted successfully" }, { status: 200 })
    } catch (error) {
        console.error("[accept-assignment] error:", error)
        return NextResponse.json({ message: `Accept assignment error: ${error}` }, { status: 500 })
    }
}