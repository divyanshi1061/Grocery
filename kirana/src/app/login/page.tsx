'use client'

import { signIn, useSession } from "next-auth/react";
import axios from "axios";
import { User, Mail, Lock, EyeOff, Eye, Loader2, LogIn } from "lucide-react";
import Image from "next/image";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";


function Login() {
   
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const session = useSession();

    console.log(session)
    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });
            if (res?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (error) {
            console.error("Error occurred while logging in:", error);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }
       
   
    return (
        <div className="min-h-screen bg-linear-to-b from-[#FFB5A1] to-white flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
               
                {/* Logo */}
                <div className="flex flex-col items-center">
                    <Image src="/icon.png" width={80} height={80} alt="Logo" className="w-20 h-20 mb-2" priority />
                    <h1 className="text-3xl font-bold text-[#EA580C]">
                        Welcome Back
                    </h1>
                    <p className="text-gray-500 text-sm text-center">
                        Login to your Kirana account and get fresh groceries delivered to your doorstep.
                    </p>
                </div>


                {/* Form */}
                <form className="mt-8 space-y-5"
                onSubmit={handleLogin}
                >
                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-200 text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                        />
                        {
                            showPassword ? (
                                <EyeOff className="absolute right-4 top-3.5 text-gray-400 w-5 h-5 cursor-pointer" onClick={() => setShowPassword(false)} />
                            ) : (
                                <Eye className="absolute right-4 top-3.5 text-gray-400 w-5 h-5 cursor-pointer" onClick={() => setShowPassword(true)} />
                            )
                        }
                    </div>
                    {
                        (() => {
                            const formValidation = email !== "" && password.length >= 6;
                             return <button className={`w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center ${formValidation ? 'bg-[#EA580C] hover:bg-orange-700' : 'bg-gray-400 cursor-not-allowed'}`} disabled={!formValidation ||loading}>
                              {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Log In"}
                               </button>
                        })()
                    }

                    <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">

                        <span className='flex-1 h-px bg-gray-200'></span>
                        OR
                        <span className='flex-1 h-px bg-gray-200'></span>
                    </div>
</form>
                    <button className="w-full py-3 rounded-xl  font-semibold border border-[#EA580C] flex items-center justify-center gap-2 hover:bg-[#EA580C] hover:text-white transition" onClick={()=>signIn("google",{redirectTo:"/"})}
                        >
                        <Image src="/google.png" width={24} height={24} alt="Google" />
                        Continue with Google
                    </button>

                {/* Login */}
                 <p className="text-center text-sm text-gray-500 mt-6" onClick={() => router.push("/register")}>
          Want to create an account?{" "}
          <span className="text-[#EA580C] font-semibold cursor-pointer hover:underline">
            Sign Up
          </span>
        </p>

            </div>
        </div>
    );
}

export default Login