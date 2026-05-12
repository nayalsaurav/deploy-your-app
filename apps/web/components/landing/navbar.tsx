"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

const navLinks = [

    {
        name: "Features",
        href: "#features",
        show: true,
    },
    {
        name: "Comparison",
        href: "#comparison",
        show: true,
    },
    {
        name: "Process",
        href: "#process",
        show: true,
    },
    {
        name: "Self Host",
        href: "#selfhost",
        show: true,
    },
];

interface NavbarProps {
    onSignIn?: () => void;
}

export const Navbar = ({ onSignIn }: NavbarProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMobileMenuOpen]);

    return (
        <nav className="absolute top-0 left-0 right-0 mx-auto z-50 flex items-center justify-between px-6 md:px-12 py-6 w-full max-w-7xl">
            <div className="flex-1 relative z-50">
                <Link href="/" className="text-2xl font-serif font-medium tracking-wide text-white" onClick={() => setIsMobileMenuOpen(false)}>
                    Launchdrop.
                </Link>
            </div>

            <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-white/90">
                {navLinks.filter(link => link.show).map((link) => (
                    <Link key={link.name} href={link.href} className="hover:text-white transition-colors">
                        {link.name}
                    </Link>
                ))}
            </div>

            <div className="flex-1 flex justify-end relative z-50">
                <button
                    onClick={onSignIn}
                    className="hidden md:inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white border border-white/30 rounded-full hover:bg-white hover:text-black transition-all duration-300 cursor-pointer"
                >
                    Sign In
                </button>
                {/* Mobile menu toggle button */}
                <button
                    className="md:hidden text-white p-2 -mr-2"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Fullscreen Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md md:hidden min-h-screen"
                    >
                        <div className="flex flex-col items-center space-y-8 w-full px-6">
                            {navLinks.filter(link => link.show).map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-2xl font-medium text-white/90 hover:text-white transition-colors"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="pt-8 w-full max-w-sm">
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        onSignIn?.();
                                    }}
                                    className="flex items-center justify-center w-full px-8 py-3.5 text-lg font-medium text-black bg-white rounded-full hover:bg-white/90 transition-all duration-300 cursor-pointer"
                                >
                                    Sign In
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

