import { auth } from "@/src/auth";
import connectDb from "@/src/lib/db";
import User from "@/src/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json(
                { message: "user is not authenticated" },
                { status: 401 }
            )
        }
        await connectDb()
        const user = await User.findOne({ email: session.user.email }).select("-password")
        if (!user) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 404 }
            )
        }
        return NextResponse.json(user, { status: 200 })
    } catch (error) {
        return NextResponse.json(
            { message: `get me error:${error}` },
            { status: 500 }
        )
    }
}