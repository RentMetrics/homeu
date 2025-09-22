
'use client';

import Image from 'next/image';
import React, { useState } from 'react';

const Banner = () => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Email submitted:', email);
        // Handle form submission logic here
    };
    return (
        <section className="min-h-screen bg-bg-black relative text-white">
            <div className="container mx-auto px-6 lg:px-8 py-8 lg:py-20">
                <div className="flex flex-col gap:7 lg:grid lg:grid-cols-2 gap-8 lg:gap-50 pt-20 md:pt-35 min-h-[70vh] md:min-h-[80vh]">
                    {/* Left Content */}
                    <div className="space-y-8 lg:space-y-10">
                        <div className="space-y-6">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-[76px] font-bold ">
                                Lower rental fees and get rewards for paying your rent
                            </h1>
                        </div>
                    </div>

                    {/* Right Image */}
                    <div className="relative lg:block flex justify-center">
                        <div className='banner-content'>
                            <p className="text-lg md:text-xl lg:text-2xl mb-10 text-text-light leading-normal max-w-2xl">
                                Experience smarter renting—unlock savings with reduced fees,
                                and earn rewards for on-time payments. Elevate your living with
                                tenant-friendly incentives. Rent smart and save more.
                            </p>

                            {/* Email Form */}
                            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg">

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Your email"
                                    className="w-full bg-white h-[62px] px-6 py-4 rounded-full text-gray-900 placeholder-gray-500 text-lg focus:outline-none focus:ring-4 focus:ring-green-500/30 transition-all duration-300"
                                    required
                                />

                                <button
                                    type="submit"
                                    className="px-8 py-3 h-14  bg-primary-main text-white font-semibold rounded-full  transform hover:scale-100 cursor-pointer transition-all duration-300  focus:outline-none focus:ring-4 focus:ring-green-500/30 text-lg whitespace-nowrap"
                                >
                                    Start now
                                </button>
                            </form>




                            <div className=" hidden lg:flex flex-col items-end justify-center gap-4 pt-30">
                                {/* Top row: images + number */}
                                <div className="flex items-center gap-4">
                                    {/* 3 circle images */}
                                    <div className="flex -space-x-4">
                                        <Image
                                            src="/images/profile1.png"
                                            alt="User 1"
                                            width={60}
                                            height={60}
                                            className="w-16 h-16 rounded-full border-2 border-black"
                                        />
                                        <Image
                                            src="/images/profile2.png"
                                            alt="User 2"
                                            width={60}
                                            height={60}
                                            className="w-16 h-16 rounded-full border-2 border-black"
                                        />
                                        <Image
                                            src="/images/profile3.png"
                                            alt="User 3"
                                            width={60}
                                            height={60}
                                            className="w-16 h-16 rounded-full border-2 border-black"
                                        />
                                    </div>

                                    {/* Number */}
                                    <h2 className="text-4xl font-bold text-white">34K</h2>
                                </div>



                                <div className='flex items-center gap-2.5'>
                                    {/* Dot */}
                                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                    {/* Bottom text */}
                                    <p className="text-lg text-white font-medium">active users</p>
                                </div>


                            </div>

                        </div>
                    </div>
                </div>
            </div>
            <div className='bannerimg absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-2/4 -bottom-45 md:-bottom-60'>
                <Image
                    src="/images/imgwomen.avif"
                    height={413}
                    width={653}
                    alt="Checkmark"
                    className="flex-shrink-0"
                />

            </div>
        </section>
    )
}

export default Banner