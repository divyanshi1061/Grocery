import connectDb from "@/src/lib/db";
import emitEventhandler from "@/src/lib/emitEventhandler";
import DeliveryAssignment from "@/src/models/deliveryAssignment.model";
import Order from "@/src/models/order.model";
import User from "@/src/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest,{params}:{params:Promise<{orderId:string}>}){
    try {
        await connectDb()
        const {orderId}=await params
        const {status}=await req.json()
        const order=await Order.findById(orderId).populate("user")
        if(!order){
            return NextResponse.json(
                {message:"order not found"},
                {status:400}
            )
        }
        order.status=status
        let deliverBoysPayload: {
            id: unknown;
            name: string;
            mobile?: string;
            latitude: number;
            longitude: number;
        }[] = []
        if(status==="out of delivery" && !order.assignment){
            const {latitude,longitude}=order.address
            const nearByDeliveryBoys=await User.find({
                role:"deliveryBoy",
                location:{
                    $near:{
                        $geometry:{type:"Point",coordinates:[Number(longitude),Number(latitude)]},
                        $maxDistance:10000
                    }
                }
            })
            const nearByIds=nearByDeliveryBoys.map((b)=>b._id)
            const busyIds=await DeliveryAssignment.find({
                assignedTo:{$in:nearByIds},
                status:{$nin:["brodcasted","completed"]}
            }).distinct("assignedTo")
            const busyIdSet= new Set(busyIds.map(b=>String(b)))
            const availableDeliveryBoys=nearByDeliveryBoys.filter(
                b=>!busyIdSet.has(String(b._id))
            )
            const candidates=availableDeliveryBoys.map(b=>b._id)
            if(candidates.length==0){
                await order.save()
                await emitEventhandler("order-status-update",{orderId:order._id,status:order.status})
                return NextResponse.json(
                    {message:"No delivery boy available"},
                    {status:200}
                )
            }

            const deliveryAssignment=await DeliveryAssignment.create({
                order:order._id,
                brodcastedTo:candidates,
                status:"brodcasted"
            })
            await deliveryAssignment.populate("order")
            for(const boyId of candidates){
                const boy=await User.findById(boyId)
                if(boy.socketId){
                    await emitEventhandler("new-assignment",deliveryAssignment,boy.socketId)
                }
            }
            order.assignment=deliveryAssignment._id
            deliverBoysPayload=availableDeliveryBoys.map(b=>({
                id:b._id,
                name:b.name,
                mobile:b.mobile,
                latitude:b.location.coordinates[1],
                longitude:b.location.coordinates[0]
            }))
            await deliveryAssignment.populate("order")
        }
        await order.save()
        await order.populate("user")
        await emitEventhandler("order-status-update",{orderId:order._id,status:order.status})

        return NextResponse.json({
            assignment:order.assignment?._id,
            availableBoys:deliverBoysPayload
        },{status:200})

    } catch (error) {
        return NextResponse.json({
            message:`update status error ${error}`
        },{status:500})
    }
}