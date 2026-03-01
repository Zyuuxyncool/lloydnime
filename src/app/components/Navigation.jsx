"use client"
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'

const Navigation = () => {
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleBack = () => {
        // Ensure we're on the client side
        if (!mounted || typeof window === 'undefined') {
            router.push('/')
            return
        }
        
        // Try to go back, but fallback to home if history is empty or would loop to error
        if (window.history.length > 2) {
            router.back()
        } else {
            router.push('/')
        }
    }

    return (
        <button onClick={handleBack} className="text-pink-400 hover:underline mb-4 inline-flex items-center gap-2 cursor-pointer">
            <ArrowLeftIcon className="h-5 w-5" />
            Kembali
        </button>
    )
}

export default Navigation