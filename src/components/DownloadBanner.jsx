"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const DownloadBanner = () => {
    return (
        <section className="w-full px-4 py-8 md:py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto"
            >
                <div className="relative overflow-hidden bg-[#2c2c2c] rounded-3xl md:rounded-[2rem] px-6 py-8 md:px-12 md:py-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-[0_8px_40px_rgba(0,0,0,0.2)]">
                    
                    {/* Decorative golden accent circles */}
                    <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#ffc107]/10 blur-2xl" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[#ffc107]/8 blur-xl" />

                    {/* Phone icon */}
                    <div className="relative shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#ffc107] flex items-center justify-center shadow-lg shadow-[#ffc107]/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 md:w-10 md:h-10 text-[#2c2c2c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>

                    {/* Text */}
                    <div className="relative flex-1 text-center md:text-left">
                        <h3 className="text-2xl md:text-3xl font-bold font-manyto text-white mb-1.5">
                            Get the{" "}
                            <span className="text-[#ffc107]">App</span>
                        </h3>
                        <p className="text-sm md:text-base text-zinc-400 font-medium">
                            Download HiveZone on your phone for the full experience — no browser needed.
                        </p>
                    </div>

                    {/* CTA Button */}
                    <Link
                        href="/download"
                        className="relative group shrink-0 inline-flex items-center gap-2.5 bg-[#ffc107] text-[#2c2c2c] font-bold text-sm md:text-base px-6 py-3 md:px-8 md:py-3.5 rounded-xl shadow-lg shadow-[#ffc107]/20 hover:shadow-[#ffc107]/40 transition-all duration-300 hover:scale-[1.04] active:scale-[0.97]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                    </Link>
                </div>
            </motion.div>
        </section>
    );
};

export default DownloadBanner;
