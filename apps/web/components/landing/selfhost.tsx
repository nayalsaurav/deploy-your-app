const points = [
    "Deploy on any server (AWS, DigitalOcean, VPS, bare metal)",
    "Keep your data and deployments fully private",
    "No usage-based pricing or hidden costs",
    "Customize every part of your infrastructure",
    "Choose your own regions and scaling strategy",
];

export function SelfHost() {
    return (
        <section id="self-host" className="relative bg-black text-white py-24 md:py-28 px-6 overflow-hidden">

            <div className="relative max-w-5xl mx-auto">
                <div className="inline-flex items-center text-gray-300 border border-gray-700 rounded-full px-4 py-1 text-sm bg-neutral-900 font-medium">
                    Self-hosted
                </div>

                <h2 className="mt-6 font-serif text-4xl md:text-5xl text-[#fdfdfd] tracking-tight">
                    Deploy on Your Own Infrastructure
                </h2>
                <p className="mt-4 text-white/85 max-w-2xl text-lg font-light">
                    Full control. Zero vendor lock-in. Run it anywhere — from a VPS to your own data center.
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    {points.map((point) => (
                        <div
                            key={point}
                            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm"
                        >
                            <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#F4E8C1]/80" />
                            <p className="text-white/85 leading-relaxed">{point}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
