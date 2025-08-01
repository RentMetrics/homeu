'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

export default function Home() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const handleStartNow = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      // This will be handled by the SignUpButton
    }
  };

  return (
    <main className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="bg-black text-white py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
                          <Image
                src="/HomeU.svg"
                alt="HomeU Logo"
                width={40}
                height={40}
              />
              <span className="text-xl font-bold">HomeU</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#how-it-works" className="text-sm hover:text-gray-300">How it works</Link>
            <Link href="#for-renters" className="text-sm hover:text-gray-300">For Renters</Link>
            <Link href="#for-properties" className="text-sm hover:text-gray-300">For Properties</Link>
            <Link href="#company" className="text-sm hover:text-gray-300">Company</Link>
            <Link href="/contact" className="text-sm hover:text-gray-300">Contact Us</Link>
          </div>
          
          <div className="flex items-center gap-3">
            {isLoaded && user ? (
              <Link href="/dashboard" className="text-sm text-green-400 hover:text-green-300">Dashboard</Link>
            ) : (
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="text-sm text-green-400 hover:text-green-300">
                  Sign in
                </Button>
              </SignInButton>
            )}
            <Button variant="outline" size="sm" className="text-xs border-gray-600 text-white hover:bg-gray-800">
              <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule demo
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-black text-white pt-2 pb-0 overflow-visible" style={{minHeight: '600px'}}>
        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-start justify-between" style={{position: 'relative'}}>
          {/* Left: Heading */}
          <div className="flex-1 flex flex-col justify-start pt-2 md:pt-4 z-20" style={{minWidth: 0}}>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] mb-4 whitespace-pre-line" style={{maxWidth: '480px', lineHeight: 1.05}}>
              Lower rental fees and get rewards for paying your rent
            </h1>
          </div>

          {/* Right: Start Now Button Only */}
          <div className="flex-1 flex flex-col items-start justify-start pt-2 md:pt-4 z-20 max-w-sm ml-auto" style={{minWidth: 0}}>
            <p className="text-gray-300 mb-4 text-base md:text-lg" style={{maxWidth: '340px'}}>
              Experience smarter renting—unlock savings with reduced fees, and earn rewards for on-time payments. Elevate your living with tenant-friendly incentives. Rent smart and save more.
            </p>
            <div className="w-full flex flex-row gap-4 mb-2 items-center justify-center">
              {isLoaded && user ? (
                <Button
                  onClick={handleStartNow}
                  className="h-14 px-8 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold text-lg whitespace-nowrap flex items-center justify-center"
                  style={{border: 'none', boxShadow: 'none'}}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <SignUpButton mode="modal">
                  <Button
                    className="h-14 px-8 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold text-lg whitespace-nowrap flex items-center justify-center"
                    style={{border: 'none', boxShadow: 'none'}}
                  >
                    Start now
                  </Button>
                </SignUpButton>
              )}
            </div>
            {/* 34K active users below button */}
            <div className="flex items-center gap-2 mt-4">
              <div className="flex -space-x-2">
                <Image src="https://randomuser.me/api/portraits/women/1.jpg?auto=format&fit=crop&q=80" alt="User" width={32} height={32} className="rounded-full border-2 border-black" />
                <Image src="https://randomuser.me/api/portraits/men/1.jpg?auto=format&fit=crop&q=80" alt="User" width={32} height={32} className="rounded-full border-2 border-black" />
                <Image src="https://randomuser.me/api/portraits/women/2.jpg?auto=format&fit=crop&q=80" alt="User" width={32} height={32} className="rounded-full border-2 border-black" />
              </div>
              <span className="text-gray-200 text-base ml-2 font-semibold">
                <span className="font-bold text-white">34K</span> active users
              </span>
            </div>
          </div>

          {/* Girl Image: Absolutely positioned, very large, overlapping sections */}
          <div className="absolute left-1/2" style={{top: '60px', transform: 'translateX(-50%)', zIndex: 30, width: '600px', height: '700px', pointerEvents: 'none'}}>
            <div className="relative w-full h-full flex flex-col items-end">
              <Image
                src="/HomeU_Landing_Hero.png"
                alt="Happy renter"
                width={4425}
                height={5000}
                className="object-contain w-full h-full drop-shadow-xl"
                style={{position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, margin: 'auto'}}
                priority
              />
              {/* Trustpilot rating box, absolutely positioned bottom right of image */}
              <div className="absolute z-40 right-[-40px] bottom-[-30px] bg-white text-black rounded-lg shadow-lg px-6 py-4 text-right border border-gray-200" style={{ minWidth: '180px' }}>
                <div className="text-2xl font-bold text-green-600">4.8 <span className="text-black">★★★★★</span></div>
                <div className="text-xs text-gray-700">Rated on Trustpilot</div>
                <div className="text-xs text-gray-700">based on <a href="#" className="underline">11345 reviews</a></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* White section below, with no extra margin, starts at the bottom of the hero image */}
      <section className="py-20 bg-gray-50 relative overflow-visible" style={{marginTop: '-180px', paddingTop: '320px', zIndex: 1}}>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="md:w-1/2 relative z-10">
              <div className="text-sm text-gray-500 mb-2">How it works</div>
              <h2 className="text-3xl font-bold mb-4">Rental history can improve your credit score</h2>
              <p className="text-gray-600 mb-6">
                Your on-time rental payments deserve recognition, unlocking benefits like lower interest rates, higher 
                approval chances, and reduced down payments.
              </p>
              <Button className="bg-green-500 hover:bg-green-600 text-white font-medium px-8 py-3 rounded-full">
                Get started
              </Button>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="relative h-60">
                  <div className="absolute inset-0">
                    <div className="h-full w-full relative">
                      {/* Credit score chart visualization */}
                      <div className="h-full w-full border-b border-l border-gray-300 relative">
                        {/* Dotted horizontal line */}
                        <div className="absolute top-1/2 w-full border-t border-dashed border-gray-300"></div>
                        
                        {/* Chart line */}
                        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <path 
                            d="M0,80 L20,80 L40,70 L60,60 L80,30 L100,20" 
                            fill="none" 
                            stroke="black" 
                            strokeWidth="2"
                          />
                        </svg>
                        
                        {/* Gradient color bar on right side */}
                        <div className="absolute right-0 inset-y-0 w-4">
                          <div className="h-full w-full bg-gradient-to-b from-green-500 via-yellow-500 to-red-500"></div>
                          <div className="absolute top-5 right-0 w-6 h-6 rounded-full bg-black border-2 border-black transform translate-x-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <p className="text-gray-700 font-medium">Boost your credit score in less than a month!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Large "01" background number */}
        <div className="absolute top-0 left-0 text-gray-100 text-[300px] font-bold leading-none opacity-30 z-0 select-none">
          01
        </div>
      </section>

      {/* Verified Renter Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row gap-10 items-start mb-12">
            <div className="md:w-1/2">
              <h2 className="text-4xl font-bold mb-4">Stand out as a verified renter</h2>
            </div>
            <div className="md:w-1/2">
              <p className="text-gray-600">
                A verified rental application showcases your consistent payment history, verified identity, and 
                reliable income over time, ensuring a swift approval process.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-lg overflow-hidden shadow-md">
              <div className="relative">
                <Image 
                  src="https://images.unsplash.com/photo-1530041539828-114de669390e?auto=format&fit=crop&q=80" 
                  alt="Pet friendly" 
                  width={400} 
                  height={300} 
                  className="w-full h-60 object-cover"
                />
                <div className="absolute top-4 left-4 bg-blue-500 text-white p-2 rounded">
                  <Image 
                    src="/HomeU_Logo.png" 
                    alt="HomeU Logo" 
                    width={24} 
                    height={24} 
                  />
                </div>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-md">
              <div className="relative">
                <Image 
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80" 
                  alt="Friends gathering" 
                  width={400} 
                  height={300} 
                  className="w-full h-60 object-cover"
                />
                <div className="absolute top-4 left-4 bg-blue-500 text-white p-2 rounded">
                  <Image 
                    src="/HomeU.svg" 
                    alt="HomeU Logo" 
                    width={24} 
                    height={24} 
                  />
                </div>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-md">
              <div className="relative">
                <Image 
                  src="https://images.unsplash.com/photo-1484712401471-05c7215830eb?auto=format&fit=crop&q=80" 
                  alt="Dinner date" 
                  width={400} 
                  height={300} 
                  className="w-full h-60 object-cover"
                />
                <div className="absolute top-4 left-4 bg-blue-500 text-white p-2 rounded">
                  <Image 
                    src="/HomeU.svg" 
                    alt="HomeU Logo" 
                    width={24} 
                    height={24} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Large "02" background number */}
        <div className="absolute top-0 left-0 text-gray-100 text-[300px] font-bold leading-none opacity-30 z-0 select-none">
          02
        </div>
      </section>

      {/* AI Tool Section */}
      <section className="py-20 bg-gray-50 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="md:w-1/2">
              <h2 className="text-4xl font-bold mb-4">Let HomeU's AI tool find your next rental home</h2>
            </div>
            <div className="md:w-1/2">
              <p className="text-gray-600 mb-6">
                Discover your perfect rental with HomeU's property search. Secure your top spot using a verified 
                application and enjoy automatic credit reporting!
              </p>
              <p className="text-gray-600 mb-10">
                Stop filling out multiple applications, use HomeU's pre-populated verified application to apply at 
                multiple locations.
              </p>
              <Button className="bg-green-500 hover:bg-green-600 text-white font-medium px-10 py-3 rounded-full">
                Search rentals
              </Button>
            </div>
          </div>
        </div>
        {/* Large "03" background number */}
        <div className="absolute top-0 left-0 text-gray-100 text-[300px] font-bold leading-none opacity-30 z-0 select-none">
          03
        </div>
      </section>

      {/* Footer with Image Background */}
      <section className="relative">
        <div className="w-full h-[900px] relative">
          <Image 
            src="/HomeU_Landing_Footer.jpeg" 
            alt="Brownstone building entrance" 
            fill
            style={{ objectFit: "cover", objectPosition: "center center" }}
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center pt-16 text-white text-center p-6">
            {/* Text at the top */}
            <div className="mb-4">
              <span className="text-5xl font-bold text-white">HomeU</span>
            </div>
            
            <div className="max-w-md text-center mb-6">
              <h2 className="text-3xl font-medium">
                Verified renters with qualified credit
              </h2>
            </div>
            
            <Button className="bg-white hover:bg-gray-100 text-green-600 font-bold px-10 py-3 rounded-full text-lg">
              Join now
            </Button>
          </div>
        </div>
        <div className="bg-gray-900 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Company Info */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start mb-4">
                  <img src="/HomeU.svg" alt="HomeU" className="h-8" />
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
                    <Link href="/signup" className="text-gray-400 hover:text-white transition-colors">
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
        </div>
      </section>
    </main>
  );
}
