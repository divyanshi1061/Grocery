import { auth } from "@/src/auth";
import connectDb from "@/src/lib/db";
import User from "@/src/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    try{
        await connectDb()
        const{role,mobile}=await req.json()

        const session=await auth()
        const user=await User.findOneAndUpdate({email:session?.user?.email},{role,mobile},{new:true})
        if(!user){
            return NextResponse.json({message:"User not found"}, {status:400})
        }
        return NextResponse.json({message:"User role and mobile updated successfully"}, {status:200})
    }

    catch(err){
        return NextResponse.json({message:`Error updating user role and mobile: ${err}`}, {status:500})
    }
}