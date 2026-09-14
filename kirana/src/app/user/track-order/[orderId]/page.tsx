'use client'

import { IUser } from '@/src/models/user.model'
import { RootState } from '@/src/redux/store'
import { getSocket } from '@/src/lib/socket'
import { IOrder } from '@/src/models/order.model'
import axios from 'axios'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  Truck,
  UserCheck,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'motion/react'
import DeliveryChat from '@/src/components/DeliveryChat'
import { Bell } from 'lucide-react'

const LiveMap = dynamic(() => import('@/src/components/LiveMap'), { ssr: false })

interface ILocation {
  latitude: number
  longitude: number
}

const statusConfig = {
  pending: {
    label: 'Order Placed',
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    icon: <Clock size={14} />,
    step: 0,
  },
  'out of delivery': {
    label: 'Out for Delivery',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: <Truck size={14} />,
    step: 1,
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    icon: <CheckCircle2 size={14} />,
    step: 2,
  },
}

const steps = ['Order Placed', 'Out for Delivery', 'Delivered']

function TrackOrder() {
  const { userData } = useSelector((state: RootState) => state.user)
  const params = useParams()
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId
  const router = useRouter()

  const [order, setOrder] = useState<IOrder>()
  const [status, setStatus] = useState<IOrder['status']>('pending')
  const [userLocation, setUserLocation] = useState<ILocation>({ latitude: 0, longitude: 0 })
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<ILocation>({ latitude: 0, longitude: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  /* ── Fetch order ──────────────────────────────────────────── */
  const fetchOrder = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const response = await axios.get(`/api/user/get-order/${orderId}`)
      const data = response.data
      setOrder(data)
      setStatus(data.status)
      setUserLocation({ latitude: data.address.latitude, longitude: data.address.longitude })
      if (data.assignedDeliveryBoy) {
        setDeliveryBoyLocation({
          // GeoJSON coordinates are [longitude, latitude]
          longitude: data.assignedDeliveryBoy.location?.coordinates?.[0] ?? 0,
          latitude: data.assignedDeliveryBoy.location?.coordinates?.[1] ?? 0,
        })
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [orderId])

  useEffect(() => {
    if (userData?._id) fetchOrder()
  }, [userData?._id, fetchOrder])

  /* ── Socket: status update ────────────────────────────────── */
  useEffect(() => {
    const socket = getSocket()
    socket.on('order-status-update', (data: { orderId: string; status: IOrder['status'] }) => {
      if (data.orderId.toString() === orderId?.toString()) {
        setStatus(data.status)
      }
    })
    return () => { socket.off('order-status-update') }
  }, [orderId])

  /* ── Socket: delivery-partner-assigned ─────────────────────── */
  useEffect(() => {
    const socket = getSocket()
    const onPartnerAssigned = (data: { orderId: string; deliveryBoy: any }) => {
      if (data.orderId.toString() === orderId?.toString()) {
        // Re-fetch to get full delivery boy details including location
        fetchOrder()
      }
    }
    socket.on('delivery-partner-assigned', onPartnerAssigned)
    return () => { socket.off('delivery-partner-assigned', onPartnerAssigned) }
  }, [orderId, fetchOrder])

  /* ── Socket: delivery-otp-sent (toast to user) ──────────────── */
  useEffect(() => {
    const socket = getSocket()
    const onOtpSent = (data: { orderId: string; message: string }) => {
      if (data.orderId.toString() === orderId?.toString()) {
        setToast(data.message)
        // Auto-dismiss after 8 seconds
        setTimeout(() => setToast(null), 8000)
      }
    }
    socket.on('delivery-otp-sent', onOtpSent)
    return () => { socket.off('delivery-otp-sent', onOtpSent) }
  }, [orderId])

  /* ── Socket: delivery-completed ─────────────────────────────── */
  useEffect(() => {
    const socket = getSocket()
    const onDelivered = (data: { orderId: string }) => {
      if (data.orderId.toString() === orderId?.toString()) {
        setStatus('delivered')
        fetchOrder()
      }
    }
    socket.on('delivery-completed', onDelivered)
    return () => { socket.off('delivery-completed', onDelivered) }
  }, [orderId, fetchOrder])

  /* ── Socket: delivery boy location ──────────────────────────── */
  useEffect(() => {
    const socket = getSocket()
    // Payload: { userId, location: { type: 'Point', coordinates: [longitude, latitude] } }
    socket.on('update-deliveryBoy-location', (data: {
      userId: string
      location: { type: string; coordinates: [number, number] }
    }) => {
      const deliveryBoy = order?.assignedDeliveryBoy
      if (deliveryBoy && typeof deliveryBoy === 'object' && '_id' in deliveryBoy) {
        if ((deliveryBoy as IUser)._id?.toString() === data.userId) {
          // GeoJSON coordinates are [longitude, latitude]
          const [longitude, latitude] = data.location.coordinates
          setDeliveryBoyLocation({ latitude, longitude })
        }
      }
    })
    return () => { socket.off('update-deliveryBoy-location') }
  }, [order?.assignedDeliveryBoy])

  /* ── Derived values ───────────────────────────────────────── */
  const cfg = statusConfig[status] ?? statusConfig.pending
  const deliveryBoy =
    order?.assignedDeliveryBoy &&
    typeof order.assignedDeliveryBoy === 'object' &&
    'name' in order.assignedDeliveryBoy
      ? (order.assignedDeliveryBoy as IUser)
      : null

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full"
        />
        <p className="text-gray-500 text-sm">Fetching order details…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-gray-50 w-full">

      {/* Sticky header */}
      <div className="fixed top-0 left-0 w-full backdrop-blur-lg bg-white/80 border-b border-orange-100 shadow-sm z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              id="back-btn"
              onClick={() => router.back()}
              className="p-2 bg-orange-50 rounded-full hover:bg-orange-100 active:scale-95 transition"
            >
              <ArrowLeft size={20} className="text-orange-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Track Order</h1>
              <p className="text-xs text-gray-400">#{order?._id?.toString().slice(-8).toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${cfg.color}`}>
              {cfg.icon}
              {cfg.label}
            </span>
            <button
              id="refresh-btn"
              onClick={() => fetchOrder(true)}
              disabled={refreshing}
              className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 active:scale-95 transition disabled:opacity-40"
            >
              <RefreshCw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-md bg-white border border-orange-200 shadow-xl rounded-2xl px-4 py-3 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <Bell size={15} className="text-orange-600" />
            </div>
            <p className="text-sm text-gray-700 flex-1">{toast}</p>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-5">

        {/* Progress tracker */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Delivery Progress</p>
          <div className="flex items-center">
            {steps.map((step, i) => {
              const done = i <= cfg.step
              const isLast = i === steps.length - 1
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0.7 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-500 ${
                        done
                          ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200'
                          : 'bg-white border-gray-200 text-gray-300'
                      }`}
                    >
                      {done ? <CheckCircle2 size={16} /> : i + 1}
                    </motion.div>
                    <p className={`text-[10px] mt-1.5 font-medium text-center leading-tight w-16 ${done ? 'text-orange-600' : 'text-gray-300'}`}>
                      {step}
                    </p>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-1 mb-6 rounded-full transition-all duration-700 ${i < cfg.step ? 'bg-orange-400' : 'bg-gray-100'}`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </motion.div>

        {/* Map — always visible, live when out for delivery */}
        {userLocation.latitude !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              {status === 'out of delivery' ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-sm font-semibold text-gray-700">Live Location</p>
                </>
              ) : (
                <>
                  <MapPin size={14} className="text-orange-500" />
                  <p className="text-sm font-semibold text-gray-700">Delivery Location</p>
                </>
              )}
            </div>
            <LiveMap
              userLocation={userLocation}
              deliveryBoyLocation={deliveryBoyLocation}
            />
          </motion.div>
        )}

        {/* Delivery boy card */}
        {deliveryBoy && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Delivery Partner</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCheck size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{deliveryBoy.name}</p>
                  <p className="text-xs text-gray-400">📞 +91 {deliveryBoy.mobile}</p>
                </div>
              </div>
              <a
                href={`tel:${deliveryBoy.mobile}`}
                id="call-delivery-btn"
                className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 active:scale-95 transition"
              >
                <Phone size={14} />
                Call
              </a>
            </div>
          </motion.div>
        )}

        {/* Delivery address */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Delivery Address</p>
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">{order?.address.fullName}</p>
              <p className="text-sm text-gray-600 mt-0.5">{order?.address.fullAddress}</p>
              <p className="text-xs text-gray-400 mt-1">{order?.address.city}, {order?.address.state} — {order?.address.pincode}</p>
            </div>
          </div>
        </motion.div>

        {/* Order items */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Items ({order?.items.length})</p>
          <div className="space-y-3">
            {order?.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-11 h-11 rounded-xl border border-gray-100 object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.quantity} × {item.unit}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-700 shrink-0">
                  ₹{Number(item.price) * item.quantity}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between items-center">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-base font-bold text-orange-600">₹{order?.totalAmount}</p>
          </div>
        </motion.div>

        {/* Chat Component */}
        {order?._id && userData?._id && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-4"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Chat Support</p>
            <DeliveryChat orderId={order._id} senderId={userData._id} role="user" />
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default TrackOrder
