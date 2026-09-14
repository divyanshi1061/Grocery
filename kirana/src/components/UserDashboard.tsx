import React from 'react'
import HeroSection from './HeroSection'
import CategorySlider from './CategorySlider'
import GroceryItemCard, { IGrocery } from './GroceryItemCard'
import Footer from './Footer'
import connectDb from '../lib/db'
import Grocery from '../models/grocery.model'

async function UserDashboard({ searchQuery }: { searchQuery?: string }) {
    await connectDb()

    const query = searchQuery
        ? {
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { category: { $regex: searchQuery, $options: 'i' } }
            ]
        }
        : {};

    const groceries = await Grocery.find(query)
    const plainGrocery = JSON.parse(JSON.stringify(groceries))

  return (
    <>
      <HeroSection/>
      <CategorySlider/>
      <div className='w-[90%] md:w-[80%] mx-auto mt-10'>
        <h2 className='text-2xl md:text-3xl font-bold text-orange-700 mb-6 text-center'>
          {searchQuery ? `Search Results for "${searchQuery}"` : "Popular Grocery Items"}
        </h2>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>{plainGrocery.map((item:IGrocery,index:number)=>(
        <GroceryItemCard key={index} item={item}/>
      ))}</div></div>
      <Footer />
    </>
  )
}

export default UserDashboard