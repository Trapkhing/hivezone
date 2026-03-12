"use client";

import React from "react";
import Image from "next/image";
import Footer from "@/components/Footer";
import SecondaryNavbar from "@/components/SecondaryNavbar";
import { motion } from "framer-motion";

const DownloadPage = () => {
    return (
        <div className="min-h-screen bg-[#f9e3a2] text-zinc-900 font-sans overflow-x-clip flex flex-col">
            {/* Navigation */}
            <SecondaryNavbar />

            {/* Page Content */}
            <main className="flex-1 pt-8 pb-16">
                <div className="max-w-4xl mx-auto px-6 md:px-12 flex flex-col items-center">

                    {/* Header */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="w-full mb-10 md:mb-16 text-center"
                    >
                        <h1 className="text-4xl md:text-6xl font-bold font-manyto leading-tight mb-4">
                            Get{" "}
                            <span className="text-[#ffc107]">Hive</span>
                            <span className="text-[#2c2c2c]">Zone</span>
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-700 font-medium max-w-xl mx-auto">
                            Download the app and take your campus community everywhere you go.
                        </p>
                    </motion.section>

                    {/* Download Card */}
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="w-full max-w-lg"
                    >
                        <div className="border-2 border-[#ffc107]/40 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 shadow-[0_4px_30px_rgba(0,0,0,0.12)] bg-white/40 backdrop-blur-sm">

                            {/* Android Section */}
                            <div className="flex flex-col items-center text-center">
                                {/* Android icon */}
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#2c2c2c] flex items-center justify-center mb-6 shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10 md:w-12 md:h-12" fill="#3DDC84">
                                        <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V7H6v11zM3.5 7C2.67 7 2 7.67 2 8.5v7c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-7C5 7.67 4.33 7 3.5 7zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85.55 12.95.25 12 .25c-.95 0-1.85.3-2.64.88L7.88.65c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.3 1.3C7.04 3.77 6 5.26 6 7h12c0-1.74-1.04-3.23-2.47-4.34zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
                                    </svg>
                                </div>

                                <h2 className="text-xl md:text-2xl font-bold font-manyto mb-2">
                                    Android
                                </h2>
                                <p className="text-sm md:text-base text-zinc-600 font-medium mb-8">
                                    Available for all Android devices (5.0+)
                                </p>

                                {/* Download Button */}
                                <a
                                    href="#"
                                    className="group relative inline-flex items-center gap-3 bg-[#2c2c2c] text-white font-bold text-base md:text-lg px-8 py-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                                >
                                    {/* Download icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download APK
                                    <span className="absolute -top-2 -right-2 bg-[#ffc107] text-[#2c2c2c] text-[0.65rem] md:text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                                        FREE
                                    </span>
                                </a>

                                {/* Version info */}
                                <p className="text-xs text-zinc-500 mt-4 font-medium">
                                    Version 1.0.0 • ~5 MB
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Installation Steps */}
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="w-full max-w-lg mt-10 md:mt-14"
                    >
                        <h3 className="text-2xl md:text-3xl font-bold font-manyto text-center mb-6 md:mb-8">
                            How to{" "}
                            <span className="text-[#ffc107]">Install</span>
                        </h3>

                        <div className="space-y-4">
                            {[
                                {
                                    step: "1",
                                    title: "Download the APK",
                                    desc: "Tap the download button above to get the APK file.",
                                },
                                {
                                    step: "2",
                                    title: "Allow installation",
                                    desc: "If prompted, go to Settings → enable \"Install from Unknown Sources\" for your browser.",
                                },
                                {
                                    step: "3",
                                    title: "Install & Open",
                                    desc: "Open the downloaded file and tap Install. You're in!",
                                },
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                                    className="flex gap-4 items-start bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-[#ffc107]/20"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-[#ffc107] flex items-center justify-center shrink-0 shadow-md">
                                        <span className="text-[#2c2c2c] font-bold font-manyto text-lg">
                                            {item.step}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base md:text-lg text-[#2c2c2c]">
                                            {item.title}
                                        </h4>
                                        <p className="text-sm md:text-base text-zinc-600 font-medium mt-0.5">
                                            {item.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>

                    {/* iOS Coming Soon */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="w-full max-w-lg mt-10 md:mt-14"
                    >
                        <div className="border-2 border-[#ffc107]/20 rounded-[2rem] p-6 md:p-8 text-center bg-white/20 backdrop-blur-sm">
                            <div className="flex items-center justify-center gap-3 mb-3">
                                {/* Apple icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                </svg>
                                <h3 className="text-xl md:text-2xl font-bold font-manyto text-zinc-400">
                                    iOS
                                </h3>
                            </div>
                            <p className="text-sm md:text-base text-zinc-500 font-semibold">
                                Coming Soon to the App Store
                            </p>
                        </div>
                    </motion.section>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default DownloadPage;
