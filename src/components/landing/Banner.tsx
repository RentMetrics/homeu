'use client';

import Image from 'next/image';
import React from 'react';
import { SignUpButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';

const Banner = () => {
    const { user, isLoaded } = useUser();

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

                            {/* Signup Button */}
                            <div className="max-w-lg">
                                {isLoaded && user ? (
                                    <Link
                                        href="/dashboard"
                                        className="inline-flex items-center justify-center px-16 py-4 h-16 bg-primary-main text-white font-semibold rounded-full transform hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/30 text-xl"
                                    >
                                        Go to Dashboard
                                    </Link>
                                ) : (
                                    <SignUpButton
                                        mode="modal"
                                        forceRedirectUrl="/get-started"
                                        signInForceRedirectUrl="/dashboard"
                                    >
                                        <button
                                            className="px-16 py-4 h-16 bg-primary-main text-white font-semibold rounded-full transform hover:scale-105 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/30 text-xl w-full sm:w-auto"
                                        >
                                            Start Now
                                        </button>
                                    </SignUpButton>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            <div className='bannerimg absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-2/4 -bottom-45 md:-bottom-60'>
                <Image
                    src="/imgwomen.avif"
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
