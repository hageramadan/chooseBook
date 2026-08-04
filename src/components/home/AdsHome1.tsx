'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import Link from 'next/link'
import { FaArrowLeft } from 'react-icons/fa'
import Image from 'next/image'

export function AdsHome1() {
  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 12,
    minutes: 45,
    seconds: 5
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        } else if (prev.days > 0) {
          return { days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format numbers to always show 2 digits
  const formatNumber = (num: number) => String(num).padStart(2, '0')

  return (
    <section className="bg-gradient-to-r from-[#FFF5F4] to-[#FFE8E6] overflow-hidden py-0">
      <div className="container mx-auto px-2 sm:px-6 lg:px-8 py-0">
        {/* تغيير flex-col إلى flex-row على جميع الشاشات */}
        <div className="flex flex-row items-center justify-between gap-2 md:gap-8">
          
          {/* Right Image - أصغر في الموبايل */}
          <div className="w-1/2 md:w-1/2 flex justify-center md:justify-end my-0 py-0">
            <div className="relative w-full max-w-[140px] md:max-w-full my-0 py-0">
              <Image 
                src="/images/sale1.png" 
                alt="Advertisement" 
                className="w-full h-auto object-contain my-0 py-0"
                width={600} 
                height={600} 
                quality={100}
                priority
                sizes="(max-width: 768px) 50vw, 50vw"
                style={{ 
                  objectPosition: 'center',
                  filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.1))',
                  marginTop: 0,
                  marginBottom: 0,
                  paddingTop: 0,
                  paddingBottom: 0
                }}
              />
            </div>
          </div>

          {/* Left Content - أصغر في الموبايل */}
          <div className="w-1/2 md:w-1/2 text-center md:text-right pt-2 md:pt-0">
            <div className="max-w-xl mx-auto md:mx-0">
              
              {/* Limited offer badge - أصغر */}
              <div className="inline-block">
                <p className="text-[8px] md:text-[16px] font-semibold px-1.5 py-0.5 md:px-4 md:py-1.5 bg-[#23A6F0]/10 text-[#23A6F0] rounded-full inline-block">
                  لفترة محدودة
                </p>
              </div>
              
              {/* Discount badge - أصغر */}
              <div className="mt-1 md:mt-6">
                <p className="text-[14px] md:text-[48px] font-bold text-[#23A6F0]">
                  خصم 50%
                </p>
                <div className="w-10 md:w-20 h-0.5 md:h-1 bg-[#23A6F0] rounded-full mt-0.5 md:mt-2 mx-auto md:mx-0"></div>
              </div>
              
              {/* Description - أصغر */}
              <p className="text-[#4A5568] text-[7px] md:text-[20px] mt-1 md:mt-6 leading-tight md:leading-relaxed">
                Lorem ipsum dolor sit amet consectetur
                <br className="hidden sm:block" />
                Accumsan massa mauris nunc lacus
              </p>
              
              {/* Shop Button - أصغر */}
              <Button
                asChild
                aria-label='buy now'
                className="rounded-xl
                 mt-2 md:mt-8 w-full sm:w-auto px-3 md:px-10 mb-2 md:mb-0 py-1 
                 md:py-6 text-[8px] md:text-[18px] font-bold hover:scale-105 transition-all duration-300 shadow-lg"
                style={{ backgroundColor: '#23A6F0' }}
              >
                <Link href="#" className="flex items-center justify-center gap-1 md:gap-2 text-white">
                  تسوق الان
                  <FaArrowLeft className="h-2 w-2 md:h-5 md:w-5" />
                </Link>
              </Button>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
}