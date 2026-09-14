"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      className="bg-gray-900 text-gray-300 py-12 mt-20 rounded-t-[3rem] shadow-[0_-10px_30px_rgba(0,0,0,0.1)] overflow-hidden"
    >
      <div className="w-[90%] md:w-[80%] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        
        {/* Brand Information */}
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-extrabold text-orange-500 tracking-wide">
            Kirana
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Your one-stop shop for fresh organic groceries, daily essentials, and more. 
            Delivering quality products directly to your doorstep with speed and reliability.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <a href="#" className="w-9 h-9 flex items-center justify-center bg-gray-800 rounded-full hover:bg-orange-500 hover:text-white transition-all text-xs font-bold">
              FB
            </a>
            <a href="#" className="w-9 h-9 flex items-center justify-center bg-gray-800 rounded-full hover:bg-orange-500 hover:text-white transition-all text-xs font-bold">
              IG
            </a>
            <a href="#" className="w-9 h-9 flex items-center justify-center bg-gray-800 rounded-full hover:bg-orange-500 hover:text-white transition-all text-xs font-bold">
              TW
            </a>
          </div>
        </div>

        {/* Navigation & Quick Links */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold text-white mb-2">Quick Links</h3>
          <Link href="/" className="hover:text-orange-400 transition-colors flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Home
          </Link>
          <Link href="/user/cart" className="hover:text-orange-400 transition-colors flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Cart
          </Link>
          <Link href="/user/my-orders" className="hover:text-orange-400 transition-colors flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> My Orders
          </Link>
          <Link href="#" className="hover:text-orange-400 transition-colors flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> About Us
          </Link>
        </div>

        {/* Contact Us */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold text-white mb-2">Contact Us</h3>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm">123 Grocery Street, Fresh Valley, Food City 400001</p>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <p className="text-sm">+91 98765 43210</p>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <p className="text-sm">support@kirana.com</p>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Kirana App. All rights reserved.
      </div>
    </motion.footer>
  );
};

export default Footer;
