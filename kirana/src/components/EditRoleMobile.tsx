'use client'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Bike, User, UserCog } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

function EditRoleMobile() {
    const [roles, setRoles] = useState(
        [{ id: 'admin', label: "Admin", icon: UserCog },
        { id: 'user', label: "User", icon: User },
        { id: 'deliveryBoy', label: "Delivery Boy", icon: Bike }
        ])
    const [selectedRole, setSelectedRole] = useState("")
    const[mobile,setMobile]=useState("")
    const {update}=useSession()
    const router=useRouter()
    const handleEdit=async()=>{
        try{
            const result=await axios.post("/api/user/edit-role-mobile",{role:selectedRole,mobile})
            await update({role:selectedRole})
            router.push("/")
            router.refresh()
            
        }catch(error){
            console.error("Error occurred while editing role:", error)
        }
    }

    useEffect(()=>{
         const checkForAdmin=async ()=>{
        try {
           const result=await axios.get("/api/checkAdmin")
           if(result.data.adminExist){
            setRoles(prev=>prev.filter(r=>r.id!=="admin"))
           } 
        } catch (error) {
            console.log(error) 
        }
    }
    checkForAdmin()
    },[])

   
    return (
        <div className='flex flex-col min-h-screen p-6 w-full items-center bg-white'>
            <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className='text-3xl font-bold text-[#16A34A] text-center mt-8'>
                Select Your Role
            </motion.h1>
            <div className='flex flex-col md:flex-row justify-center items-center gap-6 mt-10'>
                {roles.map((role) => {
                    const Icon = role.icon
                    const isSelected = selectedRole == role.id
                    return (
                        <motion.div
                            key={role.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedRole(role.id)}
                            className={`border border-transparent flex flex-col items-center justify-center gap-2 p-6 rounded-2xl w-48 h-44 shadow-md cursor-pointer 
                    transition-all ${isSelected ? 'bg-[#EA580C] text-white scale-105 border-orange-400' : 'bg-white text-gray-700 hover:border-orange-200'}`}>
                            <Icon className="w-8 h-8 mb-1" />
                            <span>{role.label}</span>
                        </motion.div>
                    )
                })}
            </div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    delay: 0.5,
                    duration: 0.6
                }}
                className='mt-10 flex flex-col items-center justify-center gap-2 text-center'>

                <label htmlFor="mobile" className="block text-gray-700 font-medium mb-2">
                    Enter your mobile number:
                </label>
                <input onChange={(e)=>setMobile(e.target.value)} value={mobile}
                 type="tel" id="mobile" placeholder="10-digit mobile number" className="w-full max-w-xs border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition-all bg-white text-gray-800 text-center" />
            </motion.div>
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className={`inline-flex items-center justify-center font-semibold shadow-md gap-2 py-3 px-8 rounded-2xl transition-all duration-200 w-[200px] mt-10 ${
                    selectedRole && mobile.length === 10 ? 'bg-[#EA580C] text-white hover:bg-orange-700' : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                onClick={handleEdit}
                disabled={!selectedRole || mobile.length !== 10}
            >
                Go to Home
            </motion.button>
        </div>


    )
}

export default EditRoleMobile