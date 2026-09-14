'use client'

import { IOrder } from '@/src/models/order.model'
import { getSocket } from '@/src/lib/socket'
import axios from 'axios'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  PackageSearch,
  Truck,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'

function TrackOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<IOrder[]>()
  const [loading, setLoading] = useState(true)

  /* ── Fetch orders ─────────────────────────────────────────── */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await axios.get('/api/user/my-orders')
        setOrders(result.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  /* ── Live status via socket ───────────────────────────────── */
  useEffect(() => {
    const socket = getSocket()
    socket.on('order-status-update', (data: { orderId: string; status: IOrder['status'] }) => {
      setOrders((prev) =>
        prev?.map((o) =>
          o._id?.toString() === data.orderId.toString()
            ? { ...o, status: data.status }
            : o
        )
      )
    })
    return () => { socket.off('order-status-update') }
  }, [])

  /* ── Status config ────────────────────────────────────────── */
  const statusConfig = {
    pending: {
      label: 'Pending',
      color: 'bg-amber-100 text-amber-700 border-amber-300',
      icon: <Clock size={13} />,
      step: 0,
    },
    'out of delivery': {
      label: 'Out for Delivery',
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      icon: <Truck size={13} />,
      step: 1,
    },
    delivered: {
      label: 'Delivered',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      icon: <CheckCircle2 size={13} />,
      step: 2,
    },
  }

  const steps = ['Order Placed', 'Out for Delivery', 'Delivered']

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full"
        />
        <p className="text-gray-500 text-sm">Loading your orders…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-gray-50 w-full">

      {/* Sticky header */}
      <div className="fixed top-0 left-0 w-full backdrop-blur-lg bg-white/80 border-b border-orange-100 shadow-sm z-50">
        <div className="max-w-3xl mx-auto flex items-center gap-4 px-4 py-3">
          <button
            id="back-btn"
            onClick={() => router.back()}
            className="p-2 bg-orange-50 rounded-full hover:bg-orange-100 active:scale-95 transition"
          >
            <ArrowLeft size={20} className="text-orange-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Track Orders</h1>
            <p className="text-xs text-gray-400">{orders?.length ?? 0} orders total</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16 space-y-6">

        {/* Empty state */}
        {orders?.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center pt-24 gap-4">
            <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center">
              <PackageSearch size={48} className="text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700">No Orders Yet</h2>
            <p className="text-gray-400 text-sm">Start shopping and your orders will appear here.</p>
            <button
              onClick={() => router.push('/')}
              className="mt-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 active:scale-95 transition"
            >
              Shop Now
            </button>
          </div>
        )}

        {/* Order cards */}
        <AnimatePresence>
          {orders?.map((order, index) => {
            const cfg = statusConfig[order.status] ?? statusConfig.pending
            const isOutForDelivery = order.status === 'out of delivery'
            const isDelivered = order.status === 'delivered'

            return (
              <motion.div
                key={order._id?.toString()}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-orange-50 to-white border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Order ID</p>
                    <h2 className="text-base font-bold text-gray-800">
                      #{order._id?.toString().slice(-8).toUpperCase()}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt!).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${cfg.color}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>

                <div className="px-5 py-4 space-y-4">

                  {/* Progress tracker */}
                  <div className="flex items-center">
                    {steps.map((step, i) => {
                      const done = i <= cfg.step
                      const isLast = i === steps.length - 1
                      return (
                        <React.Fragment key={step}>
                          <div className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 ${done
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-white border-gray-200 text-gray-300'
                              }`}>
                              {done ? <CheckCircle2 size={14} /> : i + 1}
                            </div>
                            <p className={`text-[10px] mt-1 font-medium text-center leading-tight w-14 ${done ? 'text-orange-600' : 'text-gray-300'}`}>
                              {step}
                            </p>
                          </div>
                          {!isLast && (
                            <div className={`flex-1 h-0.5 mb-5 transition-all duration-500 ${i < cfg.step ? 'bg-orange-400' : 'bg-gray-200'}`} />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-orange-500 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{order.address.fullAddress}</span>
                  </div>

                  {/* Items preview */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {order.items.slice(0, 4).map((item, i) => (
                      <div key={i} className="relative shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={44}
                          height={44}
                          className="rounded-xl border border-gray-100 object-cover"
                        />
                        {item.quantity > 1 && (
                          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 shrink-0">
                        +{order.items.length - 4}
                      </div>
                    )}
                    <div className="ml-auto shrink-0 text-sm font-bold text-gray-800">
                      ₹{order.totalAmount}
                    </div>
                  </div>

                  {/* Action button */}
                  {isOutForDelivery && (
                    <motion.button
                      id={`live-track-${order._id?.toString().slice(-6)}`}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => router.push(`/user/track-order/${order._id?.toString()}`)}
                      className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-2.5 rounded-xl transition"
                    >
                      <Truck size={16} />
                      Live Track
                    </motion.button>
                  )}

                  {isDelivered && (
                    <div className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-semibold py-2.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 size={16} />
                      Delivered
                    </div>
                  )}

                  {!isOutForDelivery && !isDelivered && (
                    <div className="w-full flex items-center justify-center gap-2 bg-amber-50 text-amber-700 text-sm font-semibold py-2.5 rounded-xl border border-amber-200">
                      <Package size={16} />
                      Preparing your order…
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

      </div>
    </div>
  )
}

export default TrackOrdersPage
