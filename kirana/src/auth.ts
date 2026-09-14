import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import connectDb from "./lib/db"
import User from "./models/user.model"
import bcrypt from "bcrypt";
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, request) {
                try {
                    await connectDb()
                    const email = credentials.email as string
                    const password = credentials.password as string
                    const user = await User.findOne({ email })

                    if (!user) {
                        throw new Error("user doesn't exist")
                    }

                    const isMatch = await bcrypt.compare(password, user.password)
                    if (!isMatch) {
                        throw new Error("Incorrect password")
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    }
                } catch (err) {
                    // Authorization failed
                    return null
 
                }
            }
        }),
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,  
        })
    ],
    callbacks: {
        async signIn({user,account}){
            if(account?.provider=="google"){
                await connectDb()
                let dbUser=await User.findOne({email:user.email})
                if(!dbUser){
                    dbUser=await User.create({
                        name:user.name,
                        email:user.email,
                        image:user.image
                    })
                }
                user.id=dbUser._id.toString()
                user.role=dbUser.role
            }
            return true
        },
        //token ke andar user ka data daalta hai

        async jwt({ token, user,trigger,session }) {
            if (user) {
                await connectDb()
                const dbUser = await User.findOne({ email: user.email })
                if (dbUser) {
                    token.id = dbUser._id.toString();
                    token.role = dbUser.role;
                } else {
                    token.id = user.id;
                    token.role = "user";
                }
                token.name = user.name;
                token.email = user.email;
            }
            if(trigger=="update" && session)
            {
                token.role=session.role
            }

            return token
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.name = token.name as string;
                session.user.email = token.email as string;
                session.user.role = token.role as string;
            } 
            return session
        }

    },
    pages:{
        signIn:"/login",
        error:"/login"
    },
    session:{
        strategy:"jwt",
        maxAge:10*24*60*60
    },
    secret:process.env.AUTH_SECRET

})

//connect db
// email check
//password match