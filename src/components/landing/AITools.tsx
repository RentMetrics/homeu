import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const AITools = () => {
  return (
     <section className="bg-white py-16 lg:py-24">
      <div className="container mx-auto px-6 lg:px-8">

                {/* Header Content */}
                <div className="grid lg:grid-cols-2 gap-5 lg:gap-16 items-start lg:mb-16 mb-7">
                    {/* Left - Title */}
                    <div className='relative z-2'>
                        <p className='number text-[#F1F1F1] -top-14 -left-1 text-[80px] md:text-[240px] font-extrabold absolute md:-top-50 md:-left-10 -z-10 italic '>02</p>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black ">
                           Let HomeU's AI tool find your next rental home
                        </h2>
                    </div>

                    {/* Right - Description */}
                    <div className="lg:pt-8 space-y-4">
                        <p className="text-lg md:text-xl text-text-light leading-relaxed">
                           Discover your perfect rental with HomeU's property search. Secure your top spot using a verified application and enjoy automatic credit reporting!
                        </p>
                        <p className="text-lg md:text-xl text-text-light leading-relaxed">
                           Stop filling out multiple applications, use HomeU's pre-populated verified application to apply at multiple locations.
                        </p>
                          {/* CTA Button */}
            <div className="pt-4">
              <Link href={"/dashboard"} className="bg-primary-main hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 transform cursor-pointer hover:-translate-y-1 shadow-lg hover:shadow-xl">
                Search rentals
              </Link>
            </div>
                    </div>
                </div>
      </div>
    </section>
  )
}

export default AITools