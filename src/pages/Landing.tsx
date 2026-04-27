import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
    ArrowRight,
    BarChart3,
    Compass,
    LineChart,
    Mail,
    ShieldCheck,
    Sparkles,
    TimerReset,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const featureCards = [
    {
        icon: Compass,
        title: 'A calmer command center',
        text: 'Track projects, sessions, tasks, and journal notes in one place so your work stops living in six browser tabs.',
    },
    {
        icon: LineChart,
        title: 'Progress you can actually read',
        text: 'Turn streaks, coding hours, and project movement into signals you can use to plan your next week with confidence.',
    },
    {
        icon: ShieldCheck,
        title: 'Built for real routines',
        text: 'CodeFolio is designed for daily use, with protected routes, session-aware auth, and a workflow that stays out of your way.',
    },
];

const quickStats = [
    { label: 'Focused sessions', value: '124' },
    { label: 'Projects tracked', value: '18' },
    { label: 'Current streak', value: '21 days' },
];

const contactCards = [
    {
        title: 'Need a walkthrough?',
        text: 'Use the sign-in flow to jump straight into your workspace and explore the product from the inside.',
        cta: 'Sign in now',
        href: '/login',
    },
    {
        title: 'Have product feedback?',
        text: 'Share ideas, workflow pain points, or feature requests with your team inbox and shape the next iteration.',
        cta: 'Start the conversation',
        href: 'mailto:contact@codefolio.app',
    },
];

const fadeInUp = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

export function Landing() {
    const reduceMotion = useReducedMotion();
    const { scrollYProgress } = useScroll();

    const haloY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 220]);
    const haloX = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -110]);
    const orbitY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -160]);
    const dashboardY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -90]);

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#fbf7ef] text-slate-900">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <motion.div
                    style={{ y: haloY, x: haloX }}
                    className="absolute left-[-10rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.18),_rgba(14,165,233,0)_68%)]"
                />
                <motion.div
                    style={{ y: orbitY }}
                    className="absolute right-[-8rem] top-[12rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(251,191,36,0.2),_rgba(251,191,36,0)_70%)]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />
            </div>

            <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#fbf7ef]/85 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200 bg-white shadow-[0_12px_30px_rgba(14,165,233,0.12)]">
                            <BarChart3 className="h-5 w-5 text-sky-600" />
                        </div>
                        <div>
                            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-sky-700">CodeFolio</p>
                            <p className="text-sm text-slate-500">Developer activity, with clarity.</p>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
                        <a href="#about" className="transition-colors hover:text-slate-950">About</a>
                        <a href="#contact" className="transition-colors hover:text-slate-950">Contact</a>
                    </nav>

                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_14px_34px_rgba(14,165,233,0.16)]"
                    >
                        Sign in
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </header>

            <main className="relative z-10">
                <section className="mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-32 lg:pt-24">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-2xl"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/90 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-sky-700 shadow-[0_10px_24px_rgba(14,165,233,0.08)]">
                            <Sparkles className="h-3.5 w-3.5" />
                            Your software work atlas
                        </div>

                        <h1 className="mt-8 max-w-xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
                            Give every coding hour a home, a pattern, and a next move.
                        </h1>

                        <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                            CodeFolio helps developers turn scattered sessions, tasks, projects, and reflections into a clean operating rhythm that is easy to trust.
                        </p>

                        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.22)] transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                            >
                                Sign in to your workspace
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <a
                                href="#about"
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50"
                            >
                                Explore what it tracks
                            </a>
                        </div>

                        <div className="mt-12 grid gap-4 sm:grid-cols-3">
                            {quickStats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 + index * 0.08, duration: 0.6 }}
                                    className="rounded-3xl border border-white/70 bg-white/80 px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur"
                                >
                                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">{stat.label}</p>
                                    <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{stat.value}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div style={{ y: dashboardY }} className="relative flex items-center justify-center">
                        <div className="relative w-full max-w-[34rem]">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.12 }}
                                className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-[0_34px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl"
                            >
                                <div className="rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(160deg,#ffffff_0%,#f5f7fb_55%,#eef5ff_100%)] p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Daily cockpit</p>
                                            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Momentum, without the mess</h2>
                                        </div>
                                        <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                                            <LineChart className="h-6 w-6" />
                                        </div>
                                    </div>

                                    <div className="mt-8 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                                        <div className="rounded-[1.4rem] bg-slate-950 p-5 text-white shadow-[0_20px_40px_rgba(15,23,42,0.24)]">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">This week</p>
                                                    <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">17.5h</p>
                                                </div>
                                                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                                    <TimerReset className="h-5 w-5 text-sky-300" />
                                                </div>
                                            </div>
                                            <div className="mt-8 flex items-end gap-2">
                                                {[44, 76, 58, 92, 66, 84, 71].map((height, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ height: 0 }}
                                                        animate={{ height }}
                                                        transition={{ delay: 0.45 + index * 0.05, duration: 0.5 }}
                                                        className="flex-1 rounded-t-full bg-gradient-to-t from-sky-400 via-cyan-300 to-amber-200"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
                                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Projects in motion</p>
                                                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">06</p>
                                                <p className="mt-2 text-sm text-slate-600">Clear status labels, recent updates, and just enough structure to keep momentum.</p>
                                            </div>
                                            <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-5 shadow-[0_16px_36px_rgba(245,158,11,0.12)]">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-2xl bg-white p-2 text-amber-500">
                                                        <Sparkles className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-950">21-day streak</p>
                                                        <p className="text-sm text-slate-600">A gentle push to stay consistent, not obsessive.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                style={{ y: orbitY }}
                                className="absolute -left-6 top-10 hidden rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-[0_22px_44px_rgba(15,23,42,0.12)] lg:block"
                            >
                                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">Journal pulse</p>
                                <p className="mt-2 text-sm text-slate-700">3 public notes this week</p>
                            </motion.div>

                            <motion.div
                                style={{ y: haloY }}
                                className="absolute -bottom-6 right-6 hidden rounded-[1.5rem] border border-sky-200 bg-sky-50/95 p-4 shadow-[0_20px_44px_rgba(14,165,233,0.14)] lg:block"
                            >
                                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-sky-700">Tasks aligned</p>
                                <p className="mt-2 text-sm text-slate-700">12 open across 4 active projects</p>
                            </motion.div>
                        </div>
                    </motion.div>
                </section>

                <section id="about" className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
                    <motion.div {...fadeInUp} className="max-w-2xl">
                        <p className="font-mono text-xs uppercase tracking-[0.26em] text-sky-700">About</p>
                        <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                            A software workspace that feels less like reporting and more like orientation.
                        </h2>
                        <p className="mt-6 text-lg leading-8 text-slate-600">
                            The product is shaped around how development actually feels: a mix of deep work, context switching, small wins, and the need to see progress without overcomplicating the process.
                        </p>
                    </motion.div>

                    <div className="mt-14 grid gap-6 lg:grid-cols-3">
                        {featureCards.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={feature.title}
                                    {...fadeInUp}
                                    transition={{ ...fadeInUp.transition, delay: index * 0.08 }}
                                    className="group rounded-[2rem] border border-white/80 bg-white/85 p-7 shadow-[0_24px_55px_rgba(15,23,42,0.08)] backdrop-blur transition-transform hover:-translate-y-1"
                                >
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#e0f2fe_0%,#fff7ed_100%)] text-sky-700">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{feature.title}</h3>
                                    <p className="mt-4 text-base leading-7 text-slate-600">{feature.text}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                <section id="contact" className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
                    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                        <motion.div
                            {...fadeInUp}
                            className="rounded-[2.4rem] bg-slate-950 px-8 py-10 text-white shadow-[0_32px_70px_rgba(15,23,42,0.22)]"
                        >
                            <p className="font-mono text-xs uppercase tracking-[0.26em] text-sky-300">Contact</p>
                            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                                Ready to make the base URL feel like a real front door?
                            </h2>
                            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                                This landing page introduces the product, points visitors toward the right next step, and gives your deployed frontend a polished public face.
                            </p>

                            <div className="mt-10 flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                                <div className="rounded-2xl bg-sky-400/15 p-3 text-sky-300">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">Product conversations</p>
                                    <p className="text-sm text-slate-300">Use sign-in for access, or route contact traffic to your support inbox.</p>
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid gap-6">
                            {contactCards.map((card, index) => {
                                const isInternal = card.href.startsWith('/');
                                const content = (
                                    <>
                                        <div>
                                            <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500">Option {index + 1}</p>
                                            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{card.title}</h3>
                                            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">{card.text}</p>
                                        </div>
                                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                                            {card.cta}
                                            <ArrowRight className="h-4 w-4" />
                                        </span>
                                    </>
                                );

                                return (
                                    <motion.div
                                        key={card.title}
                                        {...fadeInUp}
                                        transition={{ ...fadeInUp.transition, delay: index * 0.08 }}
                                        className="rounded-[2rem] border border-white/80 bg-white/90 p-7 shadow-[0_24px_55px_rgba(15,23,42,0.08)]"
                                    >
                                        {isInternal ? (
                                            <Link to={card.href} className="flex h-full flex-col justify-between gap-8">
                                                {content}
                                            </Link>
                                        ) : (
                                            <a href={card.href} className="flex h-full flex-col justify-between gap-8">
                                                {content}
                                            </a>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="relative z-10 border-t border-slate-200 bg-white/80 backdrop-blur">
                <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-10">
                    <div>
                        <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-700">CodeFolio</p>
                        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                            A cleaner public front page for the app, with a direct path into the authenticated workspace.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-8">
                        <a href="#about" className="transition-colors hover:text-slate-950">About</a>
                        <a href="#contact" className="transition-colors hover:text-slate-950">Contact</a>
                        <Link to="/login" className="font-semibold text-slate-950 transition-colors hover:text-sky-700">
                            Sign in
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
