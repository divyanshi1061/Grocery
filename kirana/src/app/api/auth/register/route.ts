import connectDb from "@/src/lib/db";
import User from "@/src/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";


export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const { name, email, password } = await req.json()
        const existUser = await User.findOne({ email })
        if (existUser) {
            return NextResponse.json(
                { message: "Email already exist!" },
                { status: 400 }
            )
        }
        if (password.length < 6) {
            return NextResponse.json(
                { message: "password must be atleast 6 characters!" },
                { status: 400 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({
            name, email, password: hashedPassword
        })
        return NextResponse.json(
            user,
            { status: 200 }
        )

    } catch (error) {
        console.error("Register error:", error)

        if (error instanceof Error && error.name === "MongooseServerSelectionError") {
            return NextResponse.json(
                { message: "Unable to connect to the database right now. Please try again later." },
                { status: 503 }
            )
        }

        return NextResponse.json(
            { message: "Registration failed. Please try again later." },
            { status: 500 }
        )
    }
}


//***Steps for registration api
//connectDB
//name,email,password
//email check
//password 6 character
//password hash
//user create