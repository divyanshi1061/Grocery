'use client'

import mongoose from 'mongoose'
import React from 'react'
import { motion } from "motion/react"
import Image from 'next/image'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../redux/store'
import { addToCart, decreaseQuatity, increaseQuatity } from '../redux/cartSlice'


export interface IGrocery {
  _id: mongoose.Types.ObjectId,
  name: string,
  category: string,
  price: string,
  unit: string,
  image: string,
  createdAt?: Date,
  updatedAt?: Date
}

function GroceryItemCard({ item }: { item: IGrocery }) {
  const imageSrc = item?.image && typeof item.image === 'string' && item.image !== 'null' ? item.image : '/icon.png'
  const dispatch=useDispatch<AppDispatch>()
  const{cartData}=useSelector((state:RootState)=>state.cart)
  const cartItem=cartData.find(i=>i._id==item._id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, amount: 0.2 }}
      className='bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col p-4 w-full'>
      <div className='relative w-full min-h-48 bg-gray-50/50 rounded-2xl overflow-hidden group mb-4'>
        <Image src={imageSrc} fill alt={item.name} sizes='(max-width:768px) 100vw,25vw' className='object-contain p-4 transition-transform duration-500 group-hover:scale-105' />
        <div className='absolute inset-0 bg-linear-to-t from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity-100 transition-all duration-300' />
      </div>
      <div className='flex flex-col flex-grow mb-4'>
        <p className='text-xs text-gray-400 font-medium mb-1'>{item.category}</p>
        <h3 className='text-gray-800 font-bold text-base mb-3 line-clamp-1'>{item.name}</h3>
        <div className='flex justify-between items-center mt-auto'>
          <span className='bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-lg font-medium capitalize'>
            {item.unit}
          </span>
          <span className='text-orange-600 font-extrabold text-lg'>₹{item.price}</span>
        </div>
      </div>
{!cartItem ?<motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        onClick={() =>dispatch(addToCart({...item,quantity:1}))}
        className='w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full py-2.5 flex items-center justify-center gap-2 font-semibold transition-all duration-300 shadow-md shadow-orange-600/20'
        
     >
        <ShoppingCart className='w-4 h-4' />
        <span className='text-sm'>Add to Cart</span>
      </motion.button> :
       <motion.div
        initial={{opacity:0,y:10}}
        animate={{opacity:1,y:0}}
        transition={{duration:0.3}} className="mt-4 flex items-center justify-center bg-orange-50 border-orange-200 rounded-full py-2 px-4 gap-4">
            <button className='w-7 h-7 flex items-center justify-center rounded-full bg-orange-100 hover:orange:200 transition-all'><Minus size={16} className='text-orange-700'onClick={()=>dispatch(decreaseQuatity(item._id))}/></button>
            <span className='text-sm font-semibold text-gray-800'>{cartItem.quantity}</span>
            <button className='w-7 h-7 flex items-center justify-center rounded-full bg-orange-100 hover:orange:200 transition-all' onClick={()=>dispatch(increaseQuatity(item._id))}><Plus size={16} className='text-orange-700'/></button>
            </motion.div>}
      

    </motion.div>
  )
}

export default GroceryItemCard