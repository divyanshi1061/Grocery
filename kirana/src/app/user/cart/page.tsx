'use client'

import { ArrowLeft, Minus, Plus, ShoppingBasket, Trash, Trash2 } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { AnimatePresence, motion } from "motion/react";
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/src/redux/store';
import Image from 'next/image';
import { decreaseQuatity, ICartItem, increaseQuatity, removeFromCart } from '@/src/redux/cartSlice';
import { useRouter } from 'next/navigation';




function CartPage() {
    const { cartData, subTotal, finalTotal, deliveryFee } = useSelector((state: RootState) => state.cart)
    const dispatch = useDispatch<AppDispatch>()
    const router = useRouter()
    return (
        <div className='w-[95%] sm:w-[90%] md:auto mt-8 mb-24 relative' >
            <Link href={"/"} className="absolute -top-2 left-0 flex items-center gap-2 text-orange-700 hover:text-orange-800 font-medium transition-all">
                <ArrowLeft size={20} /><span className='hidden sm:inline'>Back To Home</span>
            </Link>
            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 1 }}
                transition={{ duration: 0.3 }}
                className='text-2xl sm:text-3xl md:text-4xl font-bold text-orange-700 text-center mb-10'
            >Your Shopping Cart</motion.h2>

            {cartData.length == 0 ? (<motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='flex flex-col items-center justify-center p-8 bg-white border rounded-2xl shadow-sm text-center py-20 max-w-lg mx-auto mt-10'
            >
                <ShoppingBasket className="w-20 h-20 text-orange-700 mb-6 animate-bounce" />
                <h3 className="text-xl sm:text-2xl font-bold text-orange-800 mb-2">
                    Your cart is empty!
                </h3>
                <p className="text-gray-500 mb-8 max-w-sm">
                    Looks like you haven&apos;t added anything to your cart yet. Let&apos;s find some delicious items!
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                >
                    Continue Shopping →
                </Link>
            </motion.div>)

                : (
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                        <div className='lg:col-span-2 space-y-5'>
                            <AnimatePresence>
                                {cartData.map((item: ICartItem, index: number) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className='flex flex-col sm:flex-row items-center bg-white rounded-2xl shadow-md p-5 hover:shadow-xl transition-all duration-300 border border-gray-100'
                                    >
                                        <div className='relative w-28 h-28 sm:w-24 sm:h-28 md:w-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50'>
                                            <Image src={item.image}
                                                alt={item.name}
                                                fill
                                                className='object-contain p-3 transition-transform duaration-300 hover-scale-105' />
                                        </div>
                                        <div className='mt-4 sm:mt-0 sm:ml-4 flex-1 text-center sm:text-left'>
                                            <h3 className='text-base sm:text-lg font-semibold text-gray-800 line-clamp-1 '>{item.name}</h3>
                                            <p className='text-xs sm:text-sm text-gray-500'>{item.quantity}</p>
                                            <p className='text-orange-700 font-bold mt-1 text-sm sm:text-base'>₹{Number(item.price) * item.quantity}</p>
                                        </div>
                                        <div className='flex items-center justify-center sm:justify-end gap-3 mt-3 sm:mt-0 bg-gray-50 px-3 py-2 rounded-full'>
                                            <button className='bg-white p-1.5 rounded-full hover:bg-orange-100 transition-all border border-gray-300' onClick={() => dispatch(decreaseQuatity(item._id))}><Minus size={14} className='text-orange-700' /></button>
                                            <span className='font-semibold text-gray-800 text-center'>{item.quantity}</span>
                                            <button className='bg-white p-1.5 rounded-full hover:bg-orange-100 transition-all border border-gray-300' onClick={() => dispatch(increaseQuatity(item._id))}><Plus size={14} className='text-orange-700' /></button>
                                        </div>
                                        <button className='sm:ml-4 mt-3 s,:mt-0 text-red-500 hover:text-red-700 transition-all' onClick={() => dispatch(removeFromCart(item._id))}><Trash2 size={18} className='' /></button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }} className='bg-white rounded-2xl shadow-xl p-6 h-fit sticky top-24 border border-gray-100 flex flex-col'>
                            <h2 className='text-lg sm;text-xl font-bold text-gray-800 mb-4'>Order Summary</h2>
                            <div className='space-y-3 text-gray-700 text-sm sm:text-base'>
                                <div className='flex justify-between'>
                                    <span>Subtotal</span>
                                    <span className="text-orange-700 font-semibold">₹{subTotal}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span>Delivery Fee</span>
                                    <span className="text-orange-700 font-semibold">₹{deliveryFee}</span>
                                </div>
                                <hr className='my-3' />
                                <div className='flex justify-between font-bold text-lg sm:text-xl'>
                                    <span>Final Total</span>
                                    <span className="text-orange-700 font-semibold">₹{finalTotal}</span>
                                </div>
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} className='w-full mt-6 bg-orange-600 text-white py-3 rounded-full hover:bg-orange-700 transition-all font-semibold text-sm sm:text-base' onClick={()=>router.push("/user/checkout")}>Proceed To Checkout</motion.button>
                        </motion.div>

                    </div>
                )}
        </div>

    )
}

export default CartPage