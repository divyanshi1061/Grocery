"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit2, Package, Search, Trash2, Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface IGrocery {
    _id: string;
    name: string;
    category: string;
    price: string;
    unit: string;
    image: string;
}

function ViewGrocery() {
    const router = useRouter();
    const [groceries, setGroceries] = useState<IGrocery[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchGroceries = async () => {
        try {
            const result = await axios.get("/api/admin/get-groceries");
            setGroceries(result.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroceries();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        setDeletingId(id);
        try {
            await axios.delete(`/api/admin/edit-grocery/${id}`);
            setGroceries(groceries.filter((g) => g._id !== id));
        } catch (error) {
            console.error("Error deleting grocery:", error);
            alert("Failed to delete grocery");
        } finally {
            setDeletingId(null);
        }
    };

    const filteredGroceries = groceries.filter(
        (g) =>
            g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="pt-8 w-[95%] md:w-[85%] mx-auto pb-20 min-h-screen">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 text-center sm:text-left"
            >
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center justify-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold px-4 py-2 rounded-lg hover:shadow-md transition w-full sm:w-auto"
                >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </button>

                <h1 className="text-2xl md:text-3xl font-bold text-orange-700 flex items-center justify-center gap-3">
                    <Package size={32} className="text-orange-600" /> Manage Groceries
                </h1>
            </motion.div>

            {/* Search Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 relative max-w-xl mx-auto"
            >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none transition-all shadow-sm"
                />
            </motion.div>

            {/* Grid Layout for Groceries */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                >
                    <AnimatePresence>
                        {filteredGroceries.length > 0 ? (
                            filteredGroceries.map((grocery) => (
                                <motion.div
                                    key={grocery._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ y: -5 }}
                                    className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col"
                                >
                                    <div className="relative w-full h-48 bg-gray-50 flex items-center justify-center p-4">
                                        <Image
                                            src={grocery.image}
                                            alt={grocery.name}
                                            width={150}
                                            height={150}
                                            className="object-contain max-h-full drop-shadow-md"
                                        />
                                        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-orange-600 shadow-sm">
                                            {grocery.category}
                                        </span>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{grocery.name}</h3>
                                        <p className="text-gray-500 text-sm mt-1">{grocery.unit}</p>
                                        <div className="mt-auto pt-4 flex items-center justify-between">
                                            <p className="text-xl font-bold text-orange-600">₹{grocery.price}</p>
                                            <div className="flex gap-2">
                                                <Link href={`/admin/edit-grocery/${grocery._id}`}>
                                                    <button className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition">
                                                        <Edit2 size={16} />
                                                    </button>
                                                </Link>
                                                <button 
                                                    onClick={() => handleDelete(grocery._id)}
                                                    disabled={deletingId === grocery._id}
                                                    className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition disabled:opacity-50"
                                                >
                                                    {deletingId === grocery._id ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-16 text-center text-gray-500">
                                <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-lg font-medium">No groceries found</p>
                                <p className="text-sm">Try adjusting your search query.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}

export default ViewGrocery;
