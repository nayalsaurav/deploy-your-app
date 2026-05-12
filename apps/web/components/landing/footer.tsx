"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon, NewTwitterIcon, Linkedin01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { motion } from "motion/react";

export function Footer() {
    return (
        <footer className="relative bg-black text-white pt-20 overflow-hidden border-t border-white/5">
            {/* Noise Texture Overlay */}
            <svg
                className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.03] mix-blend-overlay z-10"
                aria-hidden="true"
            >
                <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>

            <div className="relative z-20 max-w-7xl mx-auto px-6 flex flex-col justify-between min-h-[40vh]">

                <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                    <div className="max-w-xs">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="font-serif text-xl font-bold tracking-tight">Launchdrop.</span>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed font-light">
                            The modern platform for edge deployments. Build, ship, and scale your applications with zero configuration.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-16">
                        <div className="flex flex-col gap-4">
                            <h4 className="font-medium text-white/90">Platform</h4>
                            <Link href="#" className="text-white/50 hover:text-white transition-colors text-sm">Deployments</Link>
                            <Link href="#" className="text-white/50 hover:text-white transition-colors text-sm">Infrastructure</Link>
                            <Link href="#" className="text-white/50 hover:text-white transition-colors text-sm">Pricing</Link>
                        </div>
                        <div className="flex flex-col gap-4">
                            <h4 className="font-medium text-white/90">Resources</h4>
                            <Link href="#" className="text-white/50 hover:text-white transition-colors text-sm">Documentation</Link>
                            <Link href="#" className="text-white/50 hover:text-white transition-colors text-sm">Blog</Link>
                            <Link href="#" className="text-white/50 hover:text-white transition-colors text-sm">Changelog</Link>
                        </div>
                        <div className="flex flex-col gap-4">
                            <h4 className="font-medium text-white/90">Socials</h4>
                            <div className="flex items-center gap-3">
                                <Link href="#" className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all">
                                    <HugeiconsIcon icon={NewTwitterIcon} className="size-4" />
                                </Link>
                                <Link href="#" className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all">
                                    <HugeiconsIcon icon={GithubIcon} className="size-4" />
                                </Link>
                                <Link href="#" className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all">
                                    <HugeiconsIcon icon={Linkedin01Icon} className="size-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-20 relative flex flex-col items-center justify-end">
                    {/* Big text with noise visually integrated */}
                    <div className="relative w-full overflow-hidden flex justify-center pb-4">
                        <h1
                            className="w-full text-center text-[8.5vw] sm:text-[9.5vw] font-serif font-bold text-transparent bg-clip-text tracking-tighter leading-none select-none max-w-full"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E"), linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0.05))`
                            }}
                        >
                            LAUNCHDROP
                        </h1>
                    </div>

                    <div className="absolute bottom-4 w-full flex flex-col sm:flex-row justify-between items-center text-xs text-white/40 border-t border-white/10 pt-4">
                        <p>© {new Date().getFullYear()} Launchdrop Inc. All rights reserved.</p>
                        <div className="flex gap-4 mt-2 sm:mt-0">
                            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
