import connectDb from "@/src/lib/db";
import Message from "@/src/models/message.model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const { senderId, text, roomId, time } = await req.json();

        if (!senderId || !text || !roomId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!mongoose.isValidObjectId(roomId)) {
            return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
        }

        await Message.create({ senderId, text, roomId, time });
        return NextResponse.json({ message: "Chat message saved successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save chat message" }, { status: 500 });
    }
}