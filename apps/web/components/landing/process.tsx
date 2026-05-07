"use client";

import { motion } from "motion/react";
import BlurText from "../blur-text";

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
        description: "Hakuro automatically detects your framework (Next.js, Vite, Node) and configures the optimal build settings.",
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                    {processData.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.7, ease: "easeOut", delay: index * 0.2 }}
                            className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 flex flex-col gap-6"
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
                                <p className="text-white/90 font-light leading-relaxed">
                                    {item.description}
                                </p>
                            </div>

                            {/* Placeholder for the visual elements shown in the design */}
                            <div className="mt-auto pt-8">
                                <div className="w-full aspect-[16/9] md:aspect-[2/1] rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 flex items-center justify-center text-gray-500 text-sm">
                                    [Visual for {item.title}]
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
