"use client";

import { ArrowLeft, Loader, Save, Upload } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState, use } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

const categories = [
    "Fruits & Vegetables",
    "Dairy & Eggs",
    "Rice, Atta & Grains",
    "Snacks & Biscuits",
    "Spices & Masalas",
    "Beverages & Drinks",
    "Personal Care",
    "Household Essential",
    "Instant & Packaged Food",
    "Baby & Pet Care"
];
const units = ["kg", "g", "liter", "ml", "piece", "pack"];

function EditGroceryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [unit, setUnit] = useState("");
    const [price, setPrice] = useState("");
    
    const [preview, setPreview] = useState<string | null>(null);
    const [backendImage, setBackendImage] = useState<File | null>(null);
    
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const fetchGrocery = async () => {
            try {
                const res = await axios.get(`/api/admin/edit-grocery/${id}`);
                const data = res.data;
                setName(data.name);
                setCategory(data.category);
                setUnit(data.unit);
                setPrice(data.price);
                setPreview(data.image);
            } catch (error) {
                console.error("Failed to fetch grocery", error);
                alert("Could not load grocery data.");
            } finally {
                setInitialLoading(false);
            }
        };
        fetchGrocery();
    }, [id]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("category", category);
            formData.append("unit", unit);
            formData.append("price", price);
            if (backendImage) {
                formData.append("image", backendImage);
            }

            await axios.put(`/api/admin/edit-grocery/${id}`, formData);
            router.push("/admin/view-grocery");
        } catch (err) {
            console.log(err);
            alert("Failed to update grocery.");
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length == 0) return;
        const file = files[0];
        setBackendImage(file);
        setPreview(URL.createObjectURL(file));
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
                <Loader className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white py-16 px-4 relative">
            <Link
                href={"/admin/view-grocery"}
                className="absolute top-6 left-6 flex items-center gap-2 text-orange-700 font-semibold bg-white px-4 py-2 rounded-full shadow-md hover:bg-orange-50 hover:shadow-lg transition-all"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden md:flex">Back to Groceries</span>
            </Link>
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-white w-full max-w-2xl shadow-2xl rounded-3xl border border-orange-100 p-8"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center gap-3">
                        <Edit2 className="w-8 h-8 text-orange-600" />
                        <h1 className="text-2xl font-bold">Edit Grocery</h1>
                    </div>
                    <p className="text-gray-500 text-sm mt-2 text-center">Update the details of the selected grocery item.</p>
                </div>
                
                <form className="flex flex-col gap-6 w-full" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="name" className="block text-gray-700 font-medium mb-1">
                            Grocery Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            type="text"
                            id="name"
                            required
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400 transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="category"
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                                onChange={(e) => setCategory(e.target.value)}
                                value={category}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option value={cat} key={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">
                                Unit <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="unit"
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                                onChange={(e) => setUnit(e.target.value)}
                                value={unit}
                                required
                            >
                                <option value="">Select Unit</option>
                                {units.map((cat) => (
                                    <option value={cat} key={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-gray-700 font-medium mb-1">
                            Price (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            onChange={(e) => setPrice(e.target.value)}
                            value={price}
                            type="number"
                            id="price"
                            required
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400 transition-all"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                        <label
                            htmlFor="image"
                            className="cursor-pointer flex items-center justify-center gap-2 bg-orange-50 text-orange-700 font-semibold border border-orange-200 rounded-xl px-6 py-3 hover:bg-orange-100 transition-all w-full sm:w-auto"
                        >
                            <Upload className="w-5 h-5" />
                            Change Image
                        </label>
                        <input
                            type="file"
                            id="image"
                            accept="image/*"
                            hidden
                            onChange={handleImageChange}
                        />
                        {preview && (
                            <Image 
                                src={preview} 
                                width={100} 
                                height={100} 
                                alt="Grocery Image Preview" 
                                className="rounded-xl shadow-md border border-gray-200 object-cover" 
                            />
                        )}
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={loading}
                        className="mt-4 w-full bg-gradient-to-r from-orange-500 to-orange-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : (
                            <>
                                <Save className="w-5 h-5" /> Save Changes
                            </>
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}

// Just an inline import for Edit2 icon since it wasn't in the primary lucide import
import { Edit2 } from "lucide-react";

export default EditGroceryPage;
