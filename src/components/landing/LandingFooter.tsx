import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const LandingFooter = () => {
    return (
        <footer className="bg-gray-900 text-white py-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Company Info */}
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start mb-4">
                            <Image src="/HomeU.svg" alt="HomeU" width={150} height={40} className="h-8" />
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                            Helping renters save money and earn rewards for on-time payments.
                        </p>
                    </div>

                    {/* Contact Information */}
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
                        <div className="space-y-2 text-sm text-gray-400">
                            <p>Phone: 888-229-3049</p>
                            <p>Email: support@homeu.co</p>
                            <p>Hours: Mon-Fri 9AM-6PM EST</p>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="text-center md:text-right">
                        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                        <div className="space-y-2 text-sm">
                            <div>
                                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                                    Contact Us
                                </Link>
                            </div>
                            <div>
                                <Link href="/properties" className="text-gray-400 hover:text-white transition-colors">
                                    Find Properties
                                </Link>
                            </div>
                            <div>
                                <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-6">
                    <div className="text-center">
                        <p className="text-sm text-gray-400">© 2024 HomeU. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default LandingFooter