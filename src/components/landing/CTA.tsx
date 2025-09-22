import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const CTA = () => {
    return (
        <div className="cta bg-[url('/cta.avif')] bg-cover bg-center h-[100vh] w-full">
            <div className='container'>
                <div className="cta-content max-w-[440px] w-full mx-auto pt-[130px]">
                    <Image
                        src="/cta-logo.svg"
                        height={100}
                        width={386}
                        alt="ctalogo"
                        className="flex-shrink-0 w-full"
                    />
                    <h4 className='text-[32px] md:text-[40px] font-bold text-white text-center'>Verified renters with qualified credit</h4>
                    <div className="pt-4 flex justify-center">
                        <Link href={"/dashboard"} className="bg-white hover:bg-green-600 text-[#2AA54C] hover:text-[#fff] font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 transform cursor-pointer hover:-translate-y-1 shadow-lg hover:shadow-xl">
                            Search rentals
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CTA