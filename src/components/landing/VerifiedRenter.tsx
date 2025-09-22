import Image from 'next/image'
import React from 'react'

const VerifiedRenter = () => {
    return (
        <section className="bg-white pb-0 pt-60 lg:pt-100 lg:pb-24">
            <div className="container mx-auto px-6 lg:px-8">

            <div className='relative lg:block hidden'>

                <div className="flex absolute -top-80 max-w-[260px] end-0 flex-col items-center justify-center text-center  gap-2  w-full ml-auto">
                    {/* Stars Row */}
                    <div className="flex items-center justify-center gap-1">
                        <Image
                            src="/star.png"
                            alt="star"
                            width={24}
                            height={24}
                            className="w-6 h-6"
                        />
                        <Image
                            src="/star.png"
                            alt="star"
                            width={24}
                            height={24}
                            className="w-6 h-6"
                        />
                        <Image
                            src="/star.png"
                            alt="star"
                            width={24}
                            height={24}
                            className="w-6 h-6"
                        />
                        <Image
                            src="/star.png"
                            alt="star"
                            width={24}
                            height={24}
                            className="w-6 h-6"
                        />
                    </div>

                    {/* Text */}
                    <p className="text-text-light text-lg font-medium">
                        Rated on <span className="font-semibold">Trustpilot</span>
                    </p>
                    <p className="text-text-light text-lg">
                        based on{" "}
                        <span className="font-semibold underline underline-offset-2">
                            11345 reviews
                        </span>
                    </p>
                </div>
            </div>


                {/* Header Content */}
                <div className="grid lg:grid-cols-2 gap-5 lg:gap-16 items-start lg:mb-16 mb-7">
                    {/* Left - Title */}
                    <div className='relative z-2'>
                        <p className='number text-[#F1F1F1] text-[80px] md:text-[240px] -top-14 -left-1 font-extrabold absolute md:-top-50 md:-left-10 -z-10 italic '>01</p>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black ">
                            Stand out as a verified renter
                        </h2>
                    </div>

                    {/* Right - Description */}
                    <div className="lg:pt-8">
                        <p className="text-lg md:text-xl text-text-light leading-relaxed">
                            A verified rental application showcases your consistent payment history, verified identity, and reliable income over time, ensuring a swift approval process.
                        </p>
                    </div>
                </div>

                {/* Images Section */}
                <div className="grid md:grid-cols-3 gap-4 lg:gap-5">
                    {/* First Image */}
                    <div className="relative group">
                        <Image
                            src="/rentnew1.avif"
                            height={413}
                            width={653}
                            alt="Checkmark"
                            className="flex-shrink-0 w-full"
                        />
                        <div className='md:w-[65px] md:h-[65px] w-[40] h-[40] absolute md:-top-6 -top-2 -end-3'>
                            <Image
                                src="/homeu.png"
                                height={65}
                                width={65}
                                alt="Checkmark"
                                className="flex-shrink-0 my-ImgAnimation"
                            />
                        </div>
                    </div>

                    {/* Second Image */}
                    <div className="relative group">
                        <Image
                            src="/rentnew.avif"
                            height={413}
                            width={653}
                            alt="Checkmark"
                            className="flex-shrink-0 w-full"
                        />
                        <div className='md:w-[65px] md:h-[65px] w-[40] h-[40] absolute md:-top-6 -top-2 -end-3'>
                            <Image
                                src="/homeu.png"
                                height={65}
                                width={65}
                                alt="Checkmark"
                                className="flex-shrink-0 my-ImgAnimation"
                            />
                        </div>
                    </div>
                    {/* Third Image */}
                    <div className="relative group">
                        <Image
                            src="/rentnew2.avif"
                            height={413}
                            width={653}
                            alt="Checkmark"
                            className="flex-shrink-0 w-full"
                        />
                        <div className='md:w-[65px] md:h-[65px] w-[40] h-[40] absolute md:-top-6 -top-2 -end-3'>
                            <Image
                                src="/homeu.png"
                                height={65}
                                width={65}
                                alt="Checkmark"
                                className="flex-shrink-0 my-ImgAnimation"
                            />
                        </div>
                    </div>
                </div>


            </div>
        </section>
    )
}

export default VerifiedRenter