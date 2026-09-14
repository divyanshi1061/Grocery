import { auth } from "@/src/auth";
import uploadOnCloudinary from "@/src/lib/cloudinary";
import connectDb from "@/src/lib/db";
import Grocery from "@/src/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDb();
        const { id } = await params;
        
        const grocery = await Grocery.findById(id);
        if (!grocery) {
            return NextResponse.json({ message: "Grocery not found" }, { status: 404 });
        }
        
        return NextResponse.json(grocery, { status: 200 });
    } catch (error) {
        console.error("GET GROCERY ERROR:", error);
        return NextResponse.json({ message: "Error fetching grocery details", error }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDb();
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const formData = await req.formData();
        
        const name = formData.get("name") as string;
        const category = formData.get("category") as string;
        const unit = formData.get("unit") as string;
        const price = formData.get("price") as string;
        const file = formData.get("image") as Blob | null;

        const updateData: any = { name, category, unit, price };

        if (file) {
            const imageUrl = await uploadOnCloudinary(file);
            updateData.image = imageUrl;
        }

        const grocery = await Grocery.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!grocery) {
            return NextResponse.json({ message: "Grocery not found" }, { status: 404 });
        }

        return NextResponse.json(grocery, { status: 200 });
    } catch (error) {
        console.error("UPDATE GROCERY ERROR:", error);
        return NextResponse.json({ message: "Error updating grocery", error }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDb();
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        
        const grocery = await Grocery.findByIdAndDelete(id);
        if (!grocery) {
            return NextResponse.json({ message: "Grocery not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Grocery deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("DELETE GROCERY ERROR:", error);
        return NextResponse.json({ message: "Error deleting grocery", error }, { status: 500 });
    }
}
