"use client";
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useState } from 'react';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };
    return (
        <nav className="bg-[#131313] text-white fixed w-full top-0 z-40">
            <div className="container mx-auto px-6 md:py-0 py-2 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo */}
                    <Link href={"/"} className='md:h-auto md:w-auto h-[32px] w-[142px]'>
<Image
                        src="/images/headerlogo.svg"
                        height={50}
                        width={193}
                        alt="Checkmark"
                        className="flex-shrink-0"
                    />
                    </Link>
                    

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-8">
                        <a href="#" className="text-text-light hover:text-white transition-colors duration-200">
                            How it works
                        </a>
                        <a href="#" className="text-text-light hover:text-white transition-colors duration-200">
                            For Renters
                        </a>
                        <a href="#" className="text-text-light hover:text-white transition-colors duration-200">
                            For Properties
                        </a>
                        <a href="#" className="text-text-light hover:text-white transition-colors duration-200">
                            Company
                        </a>
                    </div>

                    {/* Desktop Right Side */}
                    <div className="hidden lg:flex items-center space-x-4">
                        <Link href={"/"} className="text-green-400 hover:text-green-300 font-medium transition-colors duration-200 cursor-pointer">
                            Sign in
                        </Link>
                        <button className="bg-[#2B2B2B] hover:bg-[#2AA54C] text-white px-4 py-2 rounded-full flex items-center gap-2 transition-colors duration-200 cursor-pointer">
                            <Image
                                src="/images/calendar.png"
                                height={24}
                                width={24}
                                alt="Checkmark"
                                className="flex-shrink-0"
                            />
                            Schedule demo
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden">
                        <button
                            onClick={toggleMenu}
                            className="text-gray-300 cursor-pointer hover:text-white focus:outline-none focus:text-white transition-colors duration-200"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-700">
                            <Link href={"/"} className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors duration-200">
                                How it works
                            </Link>
                            <Link href={"/"} className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors duration-200">
                                For Renters
                            </Link>
                            <Link href={"/"} className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors duration-200">
                                For Properties
                            </Link>
                            <Link href={"/"} className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors duration-200">
                                Company
                            </Link>

                            {/* Mobile Right Side Buttons */}
                            <div className="pt-4 border-t border-gray-700 space-y-2">
                                <Link href={"/"} className="block w-full text-left px-3 py-2 text-green-400 hover:text-green-300 hover:bg-gray-800 rounded-md font-medium transition-colors duration-200">
                                    Sign in
                                </Link>
                                <Link href={"/"} className="flex justify-center items-center gap-2 w-full text-center px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md border border-gray-600 transition-colors duration-200">
                                    
                                    <Image
                                src="/images/calendar.png"
                                height={24}
                                width={24}
                                alt="Checkmark"
                                className="flex-shrink-0"
                            />
                                     Schedule demo
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}

export default Header