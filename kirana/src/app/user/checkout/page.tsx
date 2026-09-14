'use client'
import React, { useEffect, useState } from 'react'
import { motion } from "motion/react"
import { ArrowLeft, Building, CreditCard, CreditCardIcon, Home, Loader2, LocateFixed, MapPin, Navigation, Phone, Search, Truck, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/src/redux/store'
import axios from 'axios'
import dynamic from 'next/dynamic'

const CheckoutMap = dynamic(() => import('@/src/components/CheckoutMap'), {
    ssr: false,
    loading: () => <div className='w-full h-full bg-gray-100 flex items-center justify-center text-gray-500'>Loading Map...</div>
})

function Checkout() {
    const router = useRouter()
    const { userData } = useSelector((state: RootState) => state.user)
    const { subTotal, deliveryFee, finalTotal, cartData } = useSelector((state: RootState) => state.cart)
    const [address, setAddress] = useState(
        {
            fullName: userData?.name || "",
            mobile: userData?.mobile || "",
            city: "",
            state: "",
            pincode: "",
            fullAddress: ""
        }
    )
    const [searchQuery, setSearchQuery] = useState("")
    const [position, setPosition] = useState<[number, number] | null>(null) //latitude,longitude
    const [loading, setLoading] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod")


    const handleSearchQuery = async () => {
        setLoading(true)
        const { OpenStreetMapProvider } = await import('leaflet-geosearch')
        const provider = new OpenStreetMapProvider()
        const result = await provider.search({ query: searchQuery });
        setLoading(false)
        if (result && result.length > 0) {
            setPosition([result[0].y, result[0].x])
        }
    }
    useEffect(() => {
        if (navigator.geolocation)  //geoloaction-loacation se related jitne bhi jankari hoti hai isme milti hai
        {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords
                setPosition([latitude, longitude])
            }, (err) => { console.log('location error', err) }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 })
        }
    }, [])

    useEffect(() => {
        if (userData) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAddress((prev) => ({
                ...prev,
                fullName: userData?.name || "",
                mobile: userData?.mobile || ""
            }))
        }
    }, [userData])



    useEffect(() => {
        const fetchAddress = async () => {
            if (!position) return
            try {
                const result = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${position[0]}&lon=${position[1]}&format=json`)
                console.log(result.data)
                setAddress(prev => ({
                    ...prev,
                    city: result.data.address.city,
                    state: result.data.address.state,
                    pincode: result.data.address.postcode,
                    fullAddress: result.data.display_name
                }))
            } catch (error) {
                console.log(error)
            }
        }
        fetchAddress()
    }, [position])

    //current location
    const handleCurrentLoaction = () => {
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords
            setPosition([latitude, longitude])
        }, (err) => { console.log('location error', err) }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 })
    }

    // Cod handle karna
    const handleCod = async () => {
        if (!position) {
            return null
        }
        try {
            const result = await axios.post("/api/user/order", {
                userId: userData?._id,
                items: cartData.map(item => (
                    {
                        grocery: item._id,
                        name: item.name,
                        price: item.price,
                        unit: item.unit,
                        quantity: item.quantity,
                        image: item.image


                    }
                )),
                totalAmount: finalTotal,
                address: {
                    fullName: address.fullName,
                    mobile: address.mobile,
                    city: address.city,
                    state: address.state,
                    fullAddress: address.fullAddress,
                    pincode: address.pincode,
                    latitude: position[0],
                    longitude: position[1]
                },
                paymentMethod
            })
            router.push("/user/order-success")
        }
        catch (err) {
            console.log(err)
        }
    }

    const handleOnlineOrder = async () => {
        if (!position) {
            return null}
            try {
                const result = await axios.post("/api/user/payment", {
                    userId: userData?._id,
                    items: cartData.map(item => (
                        {
                            grocery: item._id,
                            name: item.name,
                            price: item.price,
                            unit: item.unit,
                            quantity: item.quantity,
                            image: item.image


                        }
                    )),
                    totalAmount: finalTotal,
                    address: {
                        fullName: address.fullName,
                        mobile: address.mobile,
                        city: address.city,
                        state: address.state,
                        fullAddress: address.fullAddress,
                        pincode: address.pincode,
                        latitude: position[0],
                        longitude: position[1]
                    },
                    paymentMethod
                })
                window.location.href=result.data.url
            } catch (error) {
                console.log(error)
            }
        }

        return (
            <div className='w-[92%] md:w-[80%] mx-auto py-10 relative'>
                <motion.button

                    whileTap={{ scale: 0.97 }}
                    className='absolute left-0 top-2 flex items-center gap-2 text-orange-700 hover:text-orange-800 font-semibold'
                    onClick={() => router.push("/user/cart")}>
                    <ArrowLeft size={16} />
                    <span>Back to Cart</span>
                </motion.button>
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className='text-3xl md:text-4xl font-bold text-orange-700 text-center mb-10'>Checkout</motion.h1>
                <div className='grid md:grid-cols-2 gap-8'>
                    <motion.div initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className='bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-gray-100'>
                        <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                            <MapPin className='text-orange-700' />Delivery Address
                        </h2>
                        <div className='space-y-4'>
                            <div className='relative'>
                                <User className='absolute left-3 top-3 text-orange-600' size={18} />
                                <input type="text" value={address.fullName} onChange={(e) => setAddress((prev) => ({ ...prev, fullName: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                            </div>
                            <div className='relative'>
                                <Phone className='absolute left-3 top-3 text-orange-600' size={18} />
                                <input type="text" value={address.mobile} onChange={(e) => setAddress((prev) => ({ ...prev, mobile: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                            </div>
                            <div className='relative'>
                                <Home className='absolute left-3 top-3 text-orange-600' size={18} />
                                <input type="text" value={address.fullAddress} placeholder='Full Address' onChange={(e) => setAddress((prev) => ({ ...prev, fullAddress: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                            </div>
                            <div className='grid grid-cols-3 gap-3'>
                                <div className='relative'>
                                    <Building className='absolute left-3 top-3 text-orange-600' size={18} />
                                    <input type="text" value={address.city} placeholder='city' onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                                </div>
                                <div className='relative'>
                                    <Navigation className='absolute left-3 top-3 text-orange-600' size={18} />
                                    <input type="text" value={address.state} placeholder='state' onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                                </div>
                                <div className='relative'>
                                    <Search className='absolute left-3 top-3 text-orange-600' size={18} />
                                    <input type="text" value={address.pincode} placeholder='postcode' onChange={(e) => setAddress((prev) => ({ ...prev, pincode: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                                </div>
                            </div>
                            <div className='flex gap-2 mt-3'>
                                <input type="text" placeholder="search city or area..." className="flex-1 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                <button className='bg-orange-600 text-white px-5 rounded-lg hover:bg-orange-700 transition-all font-medium' onClick={handleSearchQuery} >{loading ? <Loader2 size={16} className='animate-spin' /> : "Search"}</button></div>
                            <div className='relative mt-6 h-[330px] rounded-xl overflow-hidden border border-gray-200 shadow-inner'>
                                {position && <CheckoutMap position={position} setPosition={setPosition} />}
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    className='absolute bottom-4 right-4 bg-orange-600 text-white shadow-lg rounded-full p-3 hover:bg-orange-700 transition-all flex items-center justify-center z-[900]'
                                    onClick={handleCurrentLoaction}>
                                    <LocateFixed size={22} />
                                </motion.button>

                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-3xl border border-orange-100 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-6 h-fit"
                    >
                        <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                            <CreditCard className='text-orange-600' />Payment Method</h2>
                        <div className='space-y-4 mb-6'>
                            <button onClick={() => setPaymentMethod("online")} className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all ${paymentMethod === "online"
                                ? "border-orange-600 bg-orange-50 shadow-sm"
                                : "hover:bg-gray-50"
                                }`}>
                                <CreditCardIcon className='text-orange-600' /><span className='font-medium text-gray-700'>Pay Online (stripe)</span>
                            </button>
                            <button onClick={() => setPaymentMethod("cod")} className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all ${paymentMethod === "cod"
                                ? "border-orange-600 bg-orange-50 shadow-sm"
                                : "hover:bg-gray-50"
                                }`}>
                                <Truck className='text-orange-600' /><span className='font-medium text-gray-700'>Cash on Delivery</span>
                            </button>
                        </div>

                        <div className='border-t pt-4 text-gray-700 space-y-2 text-sm sm:text-base'>
                            <div className='flex justify-between'>
                                <span className='font-semibold'>Subtotal</span>
                                <span className='font-semibold text-orange'>₹{subTotal}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='font-semibold'>Delivery Fee</span>
                                <span className='font-semibold text-orange'>₹{deliveryFee}</span>
                            </div>
                            <div className='flex justify-between font-bold text-lg border-t pt-3 '>
                                <span className='font-semibold'>Final Total</span>
                                <span className='font-semibold text-orange'>₹{finalTotal}</span>
                            </div>
                        </div>
                        <motion.button whileTap={{ scale: 0.9 }} className='w-full mt-6 bg-orange-600 text-white py-3 rounded-full hover:bg-orange-700 transition-all font-semibold '
                            onClick={() => {
                                if (paymentMethod === "cod") {
                                    handleCod()
                                } else {
                                    handleOnlineOrder()
                                }
                            }}>
                            {paymentMethod === "cod" ? "Place Order" : "Pay & Place Order"}
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        )
    }

    export default Checkout