import { auth } from "@/src/auth";
import connectDb from "@/src/lib/db";
import Order from "@/src/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        const deliveryBoyId = session?.user?.id;

        if (!deliveryBoyId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Fetch all delivered orders for this delivery boy
        const orders = await Order.find({
            assignedDeliveryBoy: deliveryBoyId,
            deliveryOtpVerification: true
        });

        const EARNING_PER_ORDER = 40;

        const totalDeliveries = orders.length;
        const totalEarnings = totalDeliveries * EARNING_PER_ORDER;

        const today = new Date();
        const startOfToday = new Date(today);
        startOfToday.setHours(0, 0, 0, 0);

        // Calculate today's deliveries
        const todayOrders = orders.filter(o => {
            const deliveredDate = new Date(o.deliveredAt || o.updatedAt);
            return deliveredDate >= startOfToday;
        });

        const todayDeliveries = todayOrders.length;
        const todayEarnings = todayDeliveries * EARNING_PER_ORDER;

        // Build chart data for the last 7 days
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const ordersCount = orders.filter(o => {
                const deliveredDate = new Date(o.deliveredAt || o.updatedAt);
                return deliveredDate >= date && deliveredDate < nextDay;
            }).length;

            chartData.push({
                day: date.toLocaleDateString("en-US", { weekday: "short" }),
                earnings: ordersCount * EARNING_PER_ORDER,
                deliveries: ordersCount
            });
        }

        return NextResponse.json({
            todayEarnings,
            todayDeliveries,
            totalEarnings,
            totalDeliveries,
            chartData
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching earnings:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
