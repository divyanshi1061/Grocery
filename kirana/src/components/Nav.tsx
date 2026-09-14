'use client'
import React, { useEffect, useRef, useState } from 'react'
import mongoose from 'mongoose'
import Link from 'next/link';
import Image from 'next/image';
import { Boxes, Clipboard, LogOut, Menu, Package, Plus, PlusCircle, Search, ShoppingCartIcon, User, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';




interface IUser {
    _id?: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    mobile?: string;
    role: "user" | "deliveryBoy" | "admin";
    image?: string;
    images?: string;
}

function Nav({ user }: { user: IUser }) {
    const [open, setOpen] = useState(false)
    const profileDropDown = useRef<HTMLDivElement>(null)
    const [searchBarOpen, setSearchBarOpen] = useState(false)
    const [menuOpen,setMenuOpen]=useState(false)
    const {cartData}=useSelector((state:RootState)=>state.cart)
    const [searchQuery, setSearchQuery] = useState("")
    const router = useRouter()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/?q=${encodeURIComponent(searchQuery)}`)
        } else {
            router.push("/")
        }
        setSearchBarOpen(false)
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileDropDown.current && !profileDropDown.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])
    const sideBar=menuOpen?createPortal(
        <AnimatePresence>
        
            <motion.div
            initial={{x:-100,opacity:0}}
            animate={{x:0,opacity:1}}
            exit={{x:100}}
            transition={{type:"spring",stiffness:100,damping:16}}
            className='fixed top-0 left-0 h-full w-72 sm:w-80 z-[9999] bg-gradient-to-b from-orange-900/95 via-orange-800/95 to-orange-950/95 backdrop-blur-xl border-r border-orange-500/20 shadow-[5px_0_30px_rgba(0,0,0,0.3)] flex flex-col p-6 text-white'
            >
                <div className='flex justify-between items-center mb-4 pb-2 border-b border-white/10'>
                    <h1 className='font-extrabold text-xl tracking-wider text-white/95 uppercase'>Admin Panel</h1>
                    <button onClick={()=>setMenuOpen(false)} className='p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition duration-200'>
                        <X className='w-6 h-6'/>
                    </button>
                </div>
                <div className='flex items-center gap-4 mt-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg transition-all duration-300 hover:bg-white/15'>
                    <div className='relative w-12 h-12 rounded-full overflow-hidden border-2 border-orange-400/60 shadow-lg'>{user.image ? <Image src={user.image} alt={user.name} fill className="h-10 w-10 rounded-full object-cover" /> : <User />}</div>
                    <div>
                        <h2 className='text-lg font-semibold text-white'>{user.name}</h2>
                        <p className='text-xs text-orange-200 capitalize tracking-wide'>{user.role}</p>
                    </div>
                </div>
                <div className='flex flex-col gap-2 font-medium mt-6'>
                    <Link href={"/admin/add-grocery"} className='flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 hover:border-white/10 transition-all duration-300 group hover:translate-x-1'>
                        <PlusCircle className='w-5 h-5 text-orange-300 group-hover:scale-110 transition-transform' />
                        Add Grocery
                    </Link>
                    <Link href={"/admin/view-grocery"} className='flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 hover:border-white/10 transition-all duration-300 group hover:translate-x-1'>
                        <Boxes className='w-5 h-5 text-orange-300 group-hover:scale-110 transition-transform' />
                        View Grocery
                    </Link>
                    <Link href={"/admin/manage-orders"} className='flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 hover:border-white/10 transition-all duration-300 group hover:translate-x-1'>
                        <Clipboard className='w-5 h-5 text-orange-300 group-hover:scale-110 transition-transform' />
                        Manage Orders
                    </Link>
                </div>
                <div className='my-5 border-t border-white/20'></div>
                <div className='flex items-center gap-3 text-red-300 font-semibold mt-auto bg-red-950/20 hover:bg-red-500/20 border border-red-500/10 p-3 rounded-xl cursor-pointer transition-all duration-200' onClick={async()=>await signOut({callbackUrl:"/"})}>
                    <LogOut className='w-5 h-5 text-red-300'/>
                    Log Out
                </div>
            </motion.div>
       
        </AnimatePresence>,document.body
    ):null

    return (
        <div className="w-[95%] fixed top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-700 rounded-2xl shadow-lg shadow-black/30 flex justify-between items-center h-14 px-4 md:px-8 z-50">
            <Link
                href="/"
                className="text-white font-extrabold text-2xl sm:text-3xl tracking-wide hover:scale-105 transition-transform"
            >
                Kirana
            </Link>
            {user.role=="user" && <form onSubmit={handleSearch} className="hidden md:flex items-center bg-white rounded-full px-4 py-2 w-1/2 max-w-lg shadow-md">
                <Search className='text-gray-500 w-5 h-5 mr-2' />
                <input 
                    type="text" 
                    placeholder="Search groceries.." 
                    className="flex-grow focus:outline-none" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </form>}
            
            <div className="flex items-center gap-4 md:gap-6 ">
                {user.role=="user" &&<><div className='bg-white rounded-full w-11 h-11 flex items-center justify-center shadow-md hover:scale-105 transition md:hidden' onClick={() => setSearchBarOpen((prev) => !prev)}>
                    <Search className='w-6 h-6 text-orange-700' />
                </div>
                <Link href={"/user/cart"} className="relative bg-white rounded-full p-2 hover:scale-105 transition-transform justify-center items-center flex shadow-md hover:scale-105">
                    <ShoppingCartIcon />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartData.length}
                    </span>
                </Link></>}

                {user.role=="admin" && <>
                <div className='hidden md:flex items-center gap-4'>
                    <Link href={"/admin/add-grocery"} className='flex items-center gap-2 bg-white text-orange-700 font-semibold px-4 py-2 rounded-full hover:bg-orange-100 transition-all'><PlusCircle className='w-5 h-5'/>Add Grocery</Link>
                    <Link href={"/admin/view-grocery"} className='flex items-center gap-2 bg-white text-orange-700 font-semibold px-4 py-2 rounded-full hover:bg-orange-100 transition-all'><Boxes className='w-5 h-5'/>View Grocery</Link>
                    <Link href={"/admin/manage-orders"} className='flex items-center gap-2 bg-white text-orange-700 font-semibold px-4 py-2 rounded-full hover:bg-orange-100 transition-all'><Clipboard className='w-5 h-5'/> Manage Orders</Link>
                </div>
                <div className='md:hidden bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md' onClick={()=>setMenuOpen(prev=>!prev)}><Menu className='text-orange-600 w-6 h-6'/></div>
                </>}
                
                <div className="relative" ref={profileDropDown}>
                    <div className="bg-white rounded-full p-2 hover:scale-105 transition-transform justify-center items-center flex shadow-md hover:scale-105" onClick={() => setOpen(!open)}>
                        {user.images ? <Image src={user.images} alt={user.name} fill className="h-10 w-10 rounded-full object-cover" /> : <User />}
                    </div>
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.4 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
                                <div className='flex items-center gap-3 px-3 py-2 border-b border-gray-100'>
                                    <div className='w-10 h-10 relative rounded-full bg-orange-100 flex items-center justify-center overflow-hidden'>
                                        {user.image ? <Image src={user.image} alt={user.name} fill className="h-10 w-10 rounded-full object-cover" /> : <User />}
                                    </div>
                                    <div className=''>
                                        <div className='text-gray-800 font-semibold'>{user.name}</div>
                                        <div className='text-xs text-gray-500 capitalize'>{user.role}</div>
                                    </div>
                                </div>
                               {user.role=="user" && <Link href={"/user/my-orders"} className='flex items-center gap-2 px-3 py-3 hover:bg-orange-50 rounded-lg text-gray-700 font-medium' onClick={() => setOpen(false)}>
                                    <Package className='w-5 h-5 text-orange-600' />My Orders
                                </Link>}
                                <button className='flex items-center gap-2 w-full text-left px-3 py-3 hover:bg-red-50 rounded-lg text-gray-700 font-medium' onClick={() => {
                                    setOpen(false)
                                    signOut({ callbackUrl: "/login" })
                                }}>
                                    <LogOut className='w-5 h-5 text-red-700' /> Log Out

                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <AnimatePresence>{searchBarOpen &&
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className='fixed top-24 left-1/2 -translate-x-1/2 w-[90%] bd-white rounded-full shadow-lg z-40 flex items-center px-4 py-2 bg-white'>
                            <Search className='text-gray-500 w-5 h-5' />
                            <form className='grow' onSubmit={handleSearch}>
                                <input 
                                    type="text" 
                                    className='w-full outline-none text-gray-700' 
                                    placeholder='Search Groceries' 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </form>
                            <button onClick={() => { setSearchBarOpen(false) }}>
                                <X className='text-gray-500 w-5 h-5' /></button>

                        </motion.div>}
                    </AnimatePresence>
                    
                </div></div>{sideBar}
        </div>
    )
}

export default Nav