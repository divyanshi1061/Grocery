import { auth } from "@/src/auth";
import connectDb from "@/src/lib/db";
import DeliveryAssignment from "@/src/models/deliveryAssignment.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest){
    try {
        await connectDb()
        const session=await auth()
        const assignments=await DeliveryAssignment.find({
           brodcastedTo: session?.user?.id,
           status:"brodcasted"        
        }).populate("order")
        return NextResponse.json(
            assignments,
            {status:200}
        )
    } catch (error) {
         return NextResponse.json(
            {message:`get assignments error ${error}`},
            {status:500}
        )
    }
}