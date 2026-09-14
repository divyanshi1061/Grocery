'use client'
import { CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

function OrderSuccess() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center bg-gradient-to-b from-green-50 to-white">

            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
            >
                <CheckCircle className="w-24 h-24 text-orange-500" />
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold text-orange-700 mt-6"
            >
                Order Placed Successfully! 🎉
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-gray-600 text-lg max-w-xl mt-4 leading-relaxed"
            >
                Thank you for shopping with <span className="font-semibold text-orange-600">Kirana</span>.
                Your order has been confirmed and is being prepared with care.
                You can track its status anytime from the <strong>My Orders</strong> section.
            </motion.p>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8"
            >
                <Link
                    href={"/user/my-orders"}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg transition-all duration-300"
                >
                    View My Orders
                </Link>
            </motion.div>

        </div>
    )
}

export default OrderSuccess