'use client'

import React, { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import "leaflet/dist/leaflet.css"

const markerIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/128/14831/14831599.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40]
})

interface CheckoutMapProps {
    position: [number, number]
    setPosition: (pos: [number, number]) => void
}

const DraggableMarker: React.FC<{
    position: [number, number]
    setPosition: (pos: [number, number]) => void
}> = ({ position, setPosition }) => {
    const map = useMap()
    useEffect(() => {
        if (position) {
            map.setView(position as LatLngExpression, 15, { animate: true })
        }
    }, [position, map])

    return (
        <Marker
            icon={markerIcon}
            position={position as LatLngExpression}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target as L.Marker
                    const { lat, lng } = marker.getLatLng()
                    setPosition([lat, lng])
                }
            }}
        />
    )
}

export default function CheckoutMap({ position, setPosition }: CheckoutMapProps) {
    return (
        <MapContainer
            center={position as LatLngExpression}
            zoom={13}
            scrollWheelZoom={false}
            className='w-full h-full'
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker position={position} setPosition={setPosition} />
        </MapContainer>
    )
}
