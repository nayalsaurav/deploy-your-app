import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, AlertCircleIcon, Alert01Icon } from "@hugeicons/core-free-icons";

type StatusType = "yes" | "no" | "warn";

type StatusCellData = {
    status: StatusType;
    label?: string;
};

const rows: Array<{
    feature: string;
    your: StatusCellData;
    vercel: StatusCellData;
    netlify: StatusCellData;
}> = [
        {
            feature: "Self-Hosted",
            your: { status: "yes" },
            vercel: { status: "no" },
            netlify: { status: "no" },
        },
        {
            feature: "Full Backend Support",
            your: { status: "yes" },
            vercel: { status: "warn", label: "limited" },
            netlify: { status: "warn", label: "limited" },
        },
        {
            feature: "Static + SSR Hybrid",
            your: { status: "yes" },
            vercel: { status: "yes" },
            netlify: { status: "warn" },
        },
        {
            feature: "Cost Control",
            your: { status: "yes" },
            vercel: { status: "no" },
            netlify: { status: "no" },
        },
        {
            feature: "Vendor Lock-in",
            your: { status: "no" },
            vercel: { status: "yes" },
            netlify: { status: "yes" },
        },
        {
            feature: "Custom Infrastructure",
            your: { status: "yes" },
            vercel: { status: "no" },
            netlify: { status: "no" },
        },
        {
            feature: "Docker-Based Deployment",
            your: { status: "yes" },
            vercel: { status: "no" },
            netlify: { status: "no" },
        },
        {
            feature: "Real-Time Logs",
            your: { status: "yes" },
            vercel: { status: "yes" },
            netlify: { status: "yes" },
        },
        {
            feature: "Queue-Based Scaling",
            your: { status: "yes" },
            vercel: { status: "no" },
            netlify: { status: "no" },
        },
        {
            feature: "Open & Extensible",
            your: { status: "yes" },
            vercel: { status: "no" },
            netlify: { status: "no" },
        },
    ];

const statusTone = (status: StatusType) => {
    if (status === "yes") return "text-emerald-300";
    if (status === "no") return "text-rose-300";
    if (status === "warn") return "text-amber-300";
    return "text-white/80";
};

const statusIcon = (status: StatusType) => {
    if (status === "yes") return Tick02Icon;
    if (status === "no") return Alert01Icon;
    return AlertCircleIcon;
};

const StatusCell = ({ status, label }: { status: StatusType; label?: string }) => {
    const Icon = statusIcon(status);
    return (
        <span className={`inline-flex items-center gap-2 ${statusTone(status)}`}>
            <HugeiconsIcon icon={Icon} strokeWidth={2} className="h-4 w-4" />
            {label ? <span className="text-xs text-white/70">{label}</span> : null}
        </span>
    );
};

export function Comparison() {
    return (
        <section id="comparison" className="relative bg-black text-white py-24 md:py-28 px-6 overflow-hidden">

            <div className="relative max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col items-center text-center"
                >
                    <span className="inline-flex items-center text-gray-300 border border-gray-700 rounded-full px-4 py-1 text-sm bg-neutral-900 font-medium">
                        Comparison
                    </span>
                    <h2 className="mt-6 font-serif text-4xl md:text-5xl text-[#fdfdfd] tracking-tight">
                        Compare with the usual platforms
                    </h2>
                    <p className="mt-4 text-white/80 max-w-2xl text-lg font-light">
                        A clear side-by-side snapshot of capabilities so you can decide faster.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                    className="mt-12 overflow-x-auto no-scrollbar rounded-3xl border border-white/10 bg-white/3 backdrop-blur-sm"
                >
                    <table className="w-full min-w-180 border-collapse text-left">
                        <thead>
                            <tr className="text-xs uppercase tracking-wide text-white/70">
                                <th className="px-6 py-5 border-b border-white/10">Feature</th>
                                <th className="px-6 py-5 border-b border-white/10">Your Platform</th>
                                <th className="px-6 py-5 border-b border-white/10">Vercel</th>
                                <th className="px-6 py-5 border-b border-white/10">Netlify</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <motion.tr
                                    key={row.feature}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-80px" }}
                                    transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.04 }}
                                    className="border-b border-white/5 last:border-b-0"
                                >
                                    <td className="px-6 py-5 text-white/90 font-medium">
                                        {row.feature}
                                    </td>
                                    <td className="px-6 py-5">
                                        <StatusCell status={row.your.status} label={row.your.label} />
                                    </td>
                                    <td className="px-6 py-5">
                                        <StatusCell status={row.vercel.status} label={row.vercel.label} />
                                    </td>
                                    <td className="px-6 py-5">
                                        <StatusCell status={row.netlify.status} label={row.netlify.label} />
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </div>
        </section>
    );
}
