"use client";
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import BlurText from '../blur-text';

interface HeroProps {
    isReady?: boolean;
    onSignIn?: () => void;
}

export const Hero = ({ isReady = true, onSignIn }: HeroProps) => {
    return (
        <main className="min-h-screen bg-black flex flex-col items-center">
            {/* Hero Container with rounded bottom */}
            <div className="relative w-full max-w-480 h-[90dvh] md:h-[95vh] overflow-hidden rounded-b-[2rem] md:rounded-b-[4rem] shadow-2xl shadow-white/5">

                {/* Optimized Fallback Image */}
                <div className="absolute inset-0 w-full h-full -z-10">
                    <Image
                        src="/hero.jpg"
                        alt="Hero Background"
                        fill
                        priority
                        className="object-cover"
                        sizes="100vw"
                    />
                </div>

                {/* Video Background */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    aria-hidden="true"
                >
                    <source src="https://res.cloudinary.com/dcoqmeswp/video/upload/v1774949217/jbe7dvcu10lkhm4b0qct.mp4" type="video/mp4" />
                    <track kind="captions" />
                </video>

                {/* Overlay to ensure text readability */}
                <div className="absolute inset-0 bg-black/30 bg-linear-to-b from-black/40 via-transparent to-black/20" />

                {/* Hero Content */}
                {isReady && (
                    <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 md:px-8 text-center pt-16 md:pt-0">
                        <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
                            <BlurText
                                text="Ship your code"
                                delay={150}
                                animateBy="words"
                                direction="top"
                                className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] text-[#fdfdfd] tracking-tight leading-tight justify-center"
                            />
                            <BlurText
                                text="to the Edge"
                                delay={150}
                                initialDelay={0.45}
                                animateBy="words"
                                direction="top"
                                className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] text-[#fdfdfd] tracking-tight leading-tight justify-center"
                            />
                        </div>

                        <BlurText
                            text="We are a modern PaaS platform for deploying your Next.js, Vite, and Node.js applications globally in seconds. Connect your GitHub repository and we handle the rest."
                            delay={50}
                            initialDelay={1.2}
                            animateBy="words"
                            direction="bottom"
                            className="max-w-[90%] sm:max-w-2xl text-[0.9rem] sm:text-[0.95rem] md:text-base text-white/90 font-light leading-relaxed mb-8 md:mb-10 justify-center"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 2.2, ease: "easeOut" }}
                        >
                            <button
                                onClick={onSignIn}
                                className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white border border-white/30 rounded-full hover:bg-white hover:text-black transition-all duration-300 cursor-pointer"
                            >
                                Start Deploying
                            </button>
                        </motion.div>
                    </div>
                )}
            </div>
        </main>
    );
}
