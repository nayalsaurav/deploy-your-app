"use client";

import { motion } from "motion/react";
import BlurText from "../blur-text";
import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon, Folder01Icon, Rocket01Icon } from "@hugeicons/core-free-icons";

export const processData = [
    {
        id: "step-1",
        step: "Step 1",
        title: "Connect Repository",
        description: "Link your GitHub account and select the repository you want to deploy. We securely access your source code.",
    },
    {
        id: "step-2",
        step: "Step 2",
        title: "Auto-Configuration",
        description: "Launchdrop automatically detects your framework (Next.js, Vite, Node) and configures the optimal build settings.",
    },
    {
        id: "step-3",
        step: "Step 3",
        title: "Global Deployment",
        description: "Your application is containerized, built, and deployed right to our global edge network in seconds.",
    },
    {
        id: "step-4",
        step: "Step 4",
        title: "Monitor & Scale",
        description: "Get instant preview URLs for every pull request, attach custom domains, and watch your application scale effortlessly.",
    },
];

function ProcessVisual({ id }: { id: string }) {
    switch (id) {
        case "step-1":
            return (
                <div className="relative w-full h-full flex items-center justify-center gap-4 sm:gap-8 overflow-hidden">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg relative z-10">
                        <HugeiconsIcon icon={GithubIcon} className="text-white/90 size-6 sm:size-7" />
                    </div>
                    <div className="w-16 sm:w-24 h-px bg-gradient-to-r from-white/10 via-white/30 to-white/10 relative">
                        <motion.div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                            animate={{ left: ["0%", "100%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg relative z-10">
                        <HugeiconsIcon icon={Folder01Icon} className="text-white/90 size-6 sm:size-7" />
                    </div>
                </div>
            );
        case "step-2":
            return (
                <div className="relative w-full h-full flex items-center justify-center p-4">
                    <div className="w-full max-w-[90%] h-full max-h-[90%] rounded-xl bg-[#0a0a0a] border border-white/10 p-4 flex flex-col font-mono text-[10px] sm:text-xs text-white/70 shadow-2xl overflow-hidden">
                        <div className="flex gap-1.5 mb-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <p className="text-white/40">$ analyzing repository...</p>
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-emerald-400"
                            >
                                ✓ Framework detected: Next.js
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="text-blue-400"
                            >
                                ℹ Generating build configuration...
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ delay: 1.5 }}
                                className="text-white/60"
                            >
                                Ready to build.
                            </motion.p>
                        </div>
                    </div>
                </div>
            );
        case "step-3":
            return (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                        <div className="absolute w-[180%] aspect-square rounded-full border border-white/5" />
                        <div className="absolute w-[120%] aspect-square rounded-full border border-white/10" />
                        <div className="absolute w-[60%] aspect-square rounded-full border border-white/10" />
                    </div>

                    <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(236,72,153,0.2)]">
                        <HugeiconsIcon icon={Rocket01Icon} className="text-pink-300 size-8 sm:size-10" />
                    </div>

                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute top-1/2 left-1/2 w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] -ml-[50px] -mt-[50px] sm:-ml-[70px] sm:-mt-[70px]"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 12 + i * 3, repeat: Infinity, ease: "linear", delay: i * -4 }}
                        >
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/90 shadow-[0_0_12px_rgba(255,255,255,1)] absolute -top-1.5 left-1/2 -ml-1.5" />
                        </motion.div>
                    ))}
                </div>
            );
        case "step-4":
            const heights = [35, 65, 45, 85, 55, 95, 75];
            return (
                <div className="relative w-full h-full flex items-end justify-between gap-1.5 sm:gap-2 p-5 sm:p-6 overflow-hidden">
                    {heights.map((height, i) => (
                        <motion.div
                            key={i}
                            className="w-full bg-gradient-to-t from-blue-500/30 to-blue-400/10 rounded-t-sm border-t border-blue-400/40 relative group"
                            initial={{ height: "5%" }}
                            whileInView={{ height: `${height}%` }}
                            transition={{ duration: 1, delay: i * 0.1, type: "spring", bounce: 0.3 }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-px bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                    ))}

                    <motion.div
                        className="absolute top-5 left-5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 px-3 py-2 flex items-center gap-2.5 shadow-xl"
                        initial={{ y: 15, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <div className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </div>
                        <span className="text-[10px] sm:text-xs text-white/90 font-medium tracking-wide">99.99% Uptime</span>
                    </motion.div>
                </div>
            );
        default:
            return null;
    }
}

export function Process() {
    return (
        <section id="features" className="py-24 bg-black text-white px-6">
            <div className="max-w-6xl mx-auto flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <span className="inline-flex items-center text-gray-300 border border-gray-700 rounded-full px-4 py-1 text-sm bg-neutral-900 font-medium">
                        How it works
                    </span>
                </motion.div>

                <BlurText
                    text="From git push to production in seconds"
                    delay={100}
                    animateBy="words"
                    direction="top"
                    className="font-serif text-4xl md:text-5xl lg:text-6xl text-center mb-6 max-w-3xl leading-tight tracking-tight text-[#fdfdfd] justify-center"
                />

                <BlurText
                    text="We handle the complex infrastructure so you can focus on writing code. A simple, smart, and scalable deployment process."
                    delay={50}
                    initialDelay={0.4}
                    animateBy="words"
                    direction="bottom"
                    className="text-white/90 font-light text-center max-w-2xl text-lg mb-20 justify-center"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
                    {processData.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.7, ease: "easeOut", delay: index * 0.2 }}
                            className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 group hover:border-white/10 transition-colors"
                        >
                            <div className="flex flex-col gap-4">
                                <div>
                                    <span className="inline-flex items-center text-gray-300 border border-gray-700 rounded-lg px-3 py-1 text-xs bg-neutral-950 font-medium">
                                        {item.step}
                                    </span>
                                </div>
                                <h3 className="font-serif text-2xl md:text-3xl tracking-tight text-[#fdfdfd]">
                                    {item.title}
                                </h3>
                                <p className="text-white/80 font-light leading-relaxed">
                                    {item.description}
                                </p>
                            </div>

                            <div className="mt-auto pt-4 sm:pt-8">
                                <div className="w-full h-48 sm:h-56 rounded-2xl bg-neutral-950 border border-white/5 flex items-center justify-center overflow-hidden">
                                    <ProcessVisual id={item.id} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
