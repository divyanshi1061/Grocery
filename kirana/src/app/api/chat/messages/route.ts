import connectDb from "@/src/lib/db";
import Message from "@/src/models/message.model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const { roomId } = await req.json()
        
        if (!mongoose.isValidObjectId(roomId)) {
            return NextResponse.json({ error: "Invalid room ID" }, { status: 400 })
        }
        
        const messages = await Message.find({ roomId })
        return NextResponse.json(messages, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error: "Failed to find chat room" }, { status: 500 })
    }
}