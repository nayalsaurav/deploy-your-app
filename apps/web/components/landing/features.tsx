"use client";

import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    SparklesIcon,
    CheckmarkBadgeIcon,
    FolderIcon,
    ArrowRight01Icon,
    MoreHorizontalCircle01Icon,
    CreditCardIcon,
    NotificationIcon,
} from "@hugeicons/core-free-icons";
import BlurText from "../blur-text";
import BorderGlow from "../BorderGlow";

const features = [
    {
        id: "intelligent-build",
        icon: SparklesIcon,
        title: "Intelligent Build System",
        description:
            "Automatically detects frameworks like Next.js, Vite, and Node — no configuration required.",
        tag: "Auto-detect",
    },
    {
        id: "cicd",
        icon: CheckmarkBadgeIcon,
        title: "Automated CI/CD Pipeline",
        description:
            "From commit to deployment with zero manual steps. Builds, tests, and deploys instantly.",
        tag: "Zero-touch",
    },
    {
        id: "docker-isolation",
        icon: FolderIcon,
        title: "Docker-Based Isolation",
        description:
            "Every deployment runs in isolated containers for consistency and reliability.",
        tag: "Isolated",
    },
    {
        id: "dynamic-proxy",
        icon: ArrowRight01Icon,
        title: "Dynamic Reverse Proxy",
        description:
            "Smart routing based on domains and subdomains with real-time updates.",
        tag: "Smart routing",
    },
    {
        id: "hybrid-engine",
        icon: MoreHorizontalCircle01Icon,
        title: "Hybrid Deployment Engine",
        description:
            "Static apps served via CDN, dynamic apps run as containers — optimized for performance.",
        tag: "Hybrid",
    },
    {
        id: "object-storage",
        icon: CreditCardIcon,
        title: "Object Storage Integration",
        description:
            "Static assets are deployed to scalable storage using Cloudflare R2.",
        tag: "R2-ready",
    },
    {
        id: "live-logs",
        icon: NotificationIcon,
        title: "Real-Time Deployment Logs",
        description:
            "Track every step of your deployment with live logs and status updates.",
        tag: "Live signal",
    },
];

const bentoLayout = [
    "md:col-span-4 md:row-span-2",
    "md:col-span-2",
    "md:col-span-2",
    "md:col-span-3",
    "md:col-span-3",
    "md:col-span-2",
    "md:col-span-4",
];

export function Features() {
    return (
        <section
            id="features"
            className="relative bg-black text-white py-24 md:py-28 px-6 overflow-hidden"
        >
            <div className="relative max-w-6xl mx-auto flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <span className="inline-flex items-center text-gray-300 border border-gray-700 rounded-full px-4 py-1 text-sm bg-neutral-900 font-medium">
                        Features
                    </span>
                </motion.div>

                <BlurText
                    text="Everything you need to deploy at the edge"
                    delay={100}
                    animateBy="words"
                    direction="top"
                    className="font-serif text-4xl md:text-5xl lg:text-6xl text-center mb-6 max-w-3xl leading-tight tracking-tight text-[#fdfdfd] justify-center"
                />

                <BlurText
                    text="A focused toolchain that detects, builds, and routes applications with zero configuration. Built for speed, isolation, and clarity."
                    delay={50}
                    initialDelay={0.35}
                    animateBy="words"
                    direction="bottom"
                    className="text-white/90 font-light text-center max-w-2xl text-lg mb-14 justify-center"
                />

                <div className="grid grid-cols-1 md:grid-cols-6 auto-rows-[14rem] md:auto-rows-[16rem] gap-6 w-full">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.7, ease: "easeOut", delay: index * 0.1 }}
                            className={`relative h-full ${bentoLayout[index] ?? "md:col-span-2"}`}
                        >
                            <BorderGlow
                                edgeSensitivity={30}
                                glowColor="40 80 80"
                                backgroundColor="#120F17"
                                borderRadius={28}
                                glowRadius={40}
                                glowIntensity={1}
                                coneSpread={25}
                                animated={false}
                                colors={["#c084fc", "#f472b6", "#38bdf8"]}
                                className="group h-full w-full rounded-3xl border-white/10 bg-white/[0.04] backdrop-blur-sm transition-colors hover:border-white/20"
                            >
                                <div className="relative flex h-full flex-col p-6 md:p-7">
                                    <div className="flex items-center justify-between">
                                        <span className="inline-flex items-center gap-2 text-xs tracking-wide uppercase text-white/80">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.08]">
                                                <HugeiconsIcon
                                                    icon={feature.icon}
                                                    strokeWidth={2}
                                                    className="h-4 w-4 text-white/85"
                                                />
                                            </span>
                                            {feature.tag}
                                        </span>
                                        <span className="h-8 w-8 rounded-full border border-white/10 bg-white/[0.06] flex items-center justify-center text-white/70 text-xs">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                    </div>

                                    <div className="mt-5">
                                        <h3 className="font-serif text-2xl tracking-tight text-[#fdfdfd]">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-3 text-white/85 font-light leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>


                                    <div className="pointer-events-none absolute inset-x-6 bottom-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                            </BorderGlow>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
