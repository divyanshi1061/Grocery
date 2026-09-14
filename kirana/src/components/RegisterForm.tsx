import axios from "axios";
import { User, Mail, Lock, ArrowLeft, EyeOff, Eye, Loader2 } from "lucide-react";
import { signIn, SignInAuthorizationParams } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type propType = {
    previousStep: (step: number) => void
}
function RegisterForm({ previousStep }: propType) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading,setLoading]=useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const router=useRouter()

    const handleRegister = async (e:React.FormEvent) => {
       e.preventDefault();
       setLoading(true);
       setErrorMessage("");
       try {
            await axios.post("/api/auth/register",{
                name,email,password
            })

            // Automatically log in the user
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false
            })

            setLoading(false);

            if (res?.error) {
                setErrorMessage("Registration successful, but automatic login failed. Please login manually.");
                router.push("/login");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            console.error(err);
            const message = axios.isAxiosError(err) && err.response?.data?.message
                ? err.response.data.message
                : "Registration failed. Please try again later.";
            setErrorMessage(message);
            setLoading(false);
        }
    }
    return (
        <div className="min-h-screen bg-linear-to-b from-[#FFB5A1] to-white flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
                <button
                    className="flex items-center gap-2 text-[#EA580C] font-semibold hover:text-orange-700 transition mb-6"
                    onClick={() => previousStep(1)}
                >
                    <ArrowLeft
                        className="w-5 h-5" />
                    Back
                </button>
                {/* Logo */}
                <div className="flex flex-col items-center">
                    <Image src="/icon.png" width={80} height={80} alt="Logo" className="w-20 h-20 mb-2" priority />
                    <h1 className="text-3xl font-bold text-[#EA580C]">
                        Create Account
                    </h1>
                    <p className="text-gray-500 text-sm text-center">
                        Join Kirana and get fresh groceries delivered to your doorstep.
                    </p>
                </div>


                {/* Form */}
                <form className="mt-8 space-y-5"
                onSubmit={handleRegister}>

                    <div className="relative">
                        <User className="absolute left-4 top-3.5 text-gray-400 w-5 h-5"
                        />
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                        />
                    </div>

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
                            const formValidation = name !== "" && email !== "" && password.length >= 6;
                             return <button className={`w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center ${formValidation ? 'bg-[#EA580C] hover:bg-orange-700' : 'bg-gray-400 cursor-not-allowed'}`} disabled={!formValidation ||loading}>
                              {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Register"}
                               </button>
                        })()
                    }

                    {errorMessage ? (
                        <p className="text-sm text-red-600 text-center">{errorMessage}</p>
                    ) : null}

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
               <p className="text-center text-sm text-gray-500 mt-6" onClick={() => router.push("/login")}>
          Already have an account?{" "}
          <span className="text-[#EA580C] font-semibold cursor-pointer hover:underline">
            Login
          </span>
        </p>

            </div>
        </div>
    );
}

export default RegisterForm