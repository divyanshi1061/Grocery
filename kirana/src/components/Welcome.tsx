'use client'


import { motion } from 'motion/react'
import Image from 'next/image'
import { ArrowRight, TruckElectric } from 'lucide-react';

type propType = {
  nextStep: (step:number) => void
}
const Welcome = ({nextStep}:propType) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <motion.div
        initial={{
          opacity: 0,
          y: -20
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          duration: 0.6,
        }}
        className="flex flex-col items-center justify-center gap-1">
        <Image src="/icon.png" width={280} height={280} alt="icon" className="w-[280px] h-[280px] -mb-28" priority /><h1 className='text-3xl md:text-4xl font-extrabold text-[#16A34A]'>Kirana</h1></motion.div>
      <motion.p
        initial={{
          opacity: 0,
          y: 10
        }}
        animate={{
          opacity: 1,
          y: -10
        }}
        transition={{
          duration: 0.6,
          delay: 0.5
        }}
        className="mt-4 text-gray-700 text-lg md:text-xl max-w-lg">
        Your trusted grocery store for fresh produce, quality products, and everyday essentials—all in one place.
      </motion.p>
      <motion.div animate={{ x: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}>
        <TruckElectric className="w-16 h-16 text-[#16A34A]" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="mt-10"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-8 py-3 bg-[#16A34A] text-white rounded-full font-semibold shadow-lg hover:bg-green-700 transition-all duration-300"
          onClick={() => nextStep(2)}
        >
          Next
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  )
}

export default Welcome