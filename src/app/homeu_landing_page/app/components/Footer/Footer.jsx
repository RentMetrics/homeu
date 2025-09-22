import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const Footer = () => {
    return (
        // <footer className="bg-[#000] relative h-[150px] ">
        //     <div className=" w-full  bg-contain  bg-no-repeat bg-bottom absolute left-1/2 -translate-x-1/2 bottom-0 -z-1">

        //     </div>
        // </footer>
        <footer className="bg-[#121212] text-gray-400 md:py-12 py-5">
            <div className="container ">
                <div className='flex flex-wrap flex-col md:flex-row items-center justify-center md:justify-between gap-2 md:gap-4'>
                    {/* Left side: Logo */}
                    <div className="flex items-center md:justify-start justify-center gap-7 md:gap-20 flex-wrap">
                        <svg width="146" height="32" viewBox="0 0 146 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M134.852 31C128.33 31 124.371 27.3104 124.371 20.7552V7H130.026V21.0418C130.026 24.6597 131.798 26.5224 134.852 26.5224C137.906 26.5224 139.716 24.6597 139.716 21.0418V7H145.371V20.7552C145.371 27.3104 141.375 31 134.852 31Z" fill="white" />
                            <path d="M113.861 31.3598C108.749 31.3598 104.969 27.7238 104.969 23.1878C104.969 18.7598 108.857 14.9438 113.249 14.9438C117.641 14.9438 121.133 18.5438 121.133 23.9438H109.937C110.117 26.0318 111.557 27.6878 114.113 27.6878C115.985 27.6878 117.101 26.8958 117.677 25.5998L121.061 27.4718C119.873 29.8118 117.497 31.3598 113.861 31.3598ZM113.177 18.1838C111.269 18.1838 110.189 19.6238 109.937 21.3878H116.201C116.093 19.5878 114.977 18.1838 113.177 18.1838Z" fill="white" />
                            <path d="M75.0078 30.9998V15.3038H76.6998C78.4638 15.3038 79.1478 15.2678 79.9398 15.0158V17.8958C80.9478 16.0598 82.9278 14.9438 85.4478 14.9438C87.8238 14.9438 89.5878 16.0238 90.3438 18.1478C91.3878 16.1318 93.4398 14.9438 96.1758 14.9438C99.4518 14.9438 101.54 16.8878 101.54 20.6678V30.9998H96.6078V21.7478C96.6078 19.8038 95.8518 19.1198 94.4118 19.1198C92.1798 19.1198 90.7398 20.7038 90.7398 23.4398V30.9998H85.8078V21.7478C85.8078 19.8038 85.0518 19.1198 83.6118 19.1198C81.3798 19.1198 79.9398 20.7038 79.9398 23.4398V30.9998H75.0078Z" fill="white" />
                            <path d="M62.8097 27.2918C64.8977 27.2918 66.5177 25.5998 66.5177 23.1518C66.5177 20.7398 64.8977 19.0118 62.8097 19.0118C60.7577 19.0118 59.1377 20.7398 59.1377 23.1518C59.1377 25.5998 60.7577 27.2918 62.8097 27.2918ZM62.8097 31.3598C58.1297 31.3598 54.0977 27.5438 54.0977 23.1518C54.0977 18.7598 58.1297 14.9438 62.8097 14.9438C67.5257 14.9438 71.5577 18.7598 71.5577 23.1518C71.5577 27.5438 67.5257 31.3598 62.8097 31.3598Z" fill="white" />
                            <path d="M44.932 31V21.064H36.4V31H31V7.23999H36.4V16.888H44.932V7.23999H50.332V31H44.932Z" fill="white" />
                            <path d="M10.3923 0L21 8H0L10.3923 0Z" fill="#578BD9" />
                            <rect y="8" width="21" height="24" fill="#578BD9" />
                        </svg>

                        {/* Links */}
                        <div className="flex items-center justify-center w-full md:w-auto md:gap-4 gap-2">
                            <Link href="/" className="hover:text-white transition text-[#858585] text-lg md:text-xl">
                                Terms of Use
                            </Link>
                            <span>|</span>
                            <Link href="/" className="hover:text-white transition text-[#858585] text-lg md:text-xl">
                                Privacy Policy
                            </Link>
                        </div>
                    </div>

                    {/* Right side: Copyright */}
                    <div className=" text-[#858585] text-lg md:text-xl">
                        © 2025 HomeU. All rights reserved.
                    </div>
                </div>


            </div>
        </footer>
    )
}

export default Footer