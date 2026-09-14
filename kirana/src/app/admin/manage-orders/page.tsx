'use client'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import {motion} from "motion/react"
import { PackageCheck } from 'lucide-react'
import AdminOrderCard from '@/src/components/AdminOrderCard'
import { getSocket } from '@/src/lib/socket'
import { IOrder } from '@/src/models/order.model'


function ManageOrders() {
  const[orders,setOrders]=useState<IOrder[]>()

  useEffect(()=>{
    const getOrders= async ()=>{
      try {
        const result=await axios.get("/api/admin/get-orders")
        setOrders(result.data)
      } catch (error) {
        console.log(error)
      }
    }
    getOrders()
  },[])

  useEffect(():any=>{
    const socket=getSocket()
    socket.on("new-order",(newOrder)=>{
      setOrders((prev)=>[newOrder,...prev!])
    })
    return ()=>socket.off("new-order")
  },[])
  return (
  <div className='min-h-screen bg-gray-50 w-full'>  
  <motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
>
  <div className="flex items-center gap-4">
    <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
      <PackageCheck className="w-8 h-8 text-orange-600" />
    </div>

    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
        Manage Orders
      </h1>

      <p className="text-gray-500 mt-1">
        View, track and manage customer orders.
      </p>
    </div>
  </div>

  <div className="bg-orange-50 text-orange-700 px-5 py-2 rounded-xl font-semibold shadow-sm">
    Admin Panel
  </div>
</motion.div>
<div className='max-w-6xl mx-auto px-4 pt-24 pb-16 space-y-8'>
  <div className='space-y-6'>
  {orders?.map((order, index) => (
  <AdminOrderCard
    key={index}
    order={order}
  />
))}
</div></div>

</div>

  )
}

export default ManageOrders
