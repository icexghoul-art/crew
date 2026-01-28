import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sword, Users, Trophy, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen max-h-[900px] flex items-center justify-center overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay z-0" />

        <motion.div
          className="container mx-auto px-4 relative z-10 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6 inline-block">
            <span className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium tracking-wider uppercase">
              Gorosei
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-8xl font-black font-display tracking-tight mb-6 neon-text text-white"
          >
            DOMINATE THE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              WORLD
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-light"
          >
            Join the elite Blox Fruits crew. Competitive wars, daily
            tournaments, and a community of top-tier players.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
              asChild
            >
              <a href="/api/auth/discord">
                Join via Discord <ChevronRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg border-white/20 hover:bg-white/5"
              asChild
            >
              <Link href="/wars">View War Logs</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard
              icon={Sword}
              label="War Victories"
              value="142"
              subtext="Win Rate: 89%"
              color="text-primary"
            />
            <StatCard
              icon={Users}
              label="Active Members"
              value="50+"
              subtext="Elite Squads"
              color="text-accent"
            />
            <StatCard
              icon={Trophy}
              label="Tournaments Won"
              value="24"
              subtext="This Season"
              color="text-yellow-500"
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
            Why Join Us?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We aren't just a crew; we're a powerhouse. Here's what we offer to
            our dedicated members.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            title="Competitive Wars"
            desc="Regular 3v3 and 6v6 crew wars against the top leaderboard crews."
            image="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60"
          />
          <FeatureCard
            title="Elite Training"
            desc="One-on-one PvP coaching from top bounty hunters to improve your skills."
            image="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=60"
          />
          <FeatureCard
            title="Active Community"
            desc="A thriving Discord server with giveaways, fruit trading, and raids."
            image="https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&auto=format&fit=crop&q=60"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext, color }: any) {
  return (
    <div className="p-8 rounded-2xl bg-secondary/50 border border-white/5 hover:border-primary/20 transition-all group">
      <Icon className={`w-10 h-10 mb-4 ${color}`} />
      <div className="text-4xl font-bold font-display mb-1">{value}</div>
      <div className="text-lg font-medium text-foreground">{label}</div>
      <div className="text-sm text-muted-foreground mt-2">{subtext}</div>
    </div>
  );
}

function FeatureCard({ title, desc, image }: any) {
  return (
    <div className="group rounded-2xl overflow-hidden bg-secondary border border-white/5 hover:border-primary/40 transition-all duration-300">
      <div className="h-48 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-secondary to-transparent z-10" />
        {/* Unsplash gaming setup */}
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="p-6 relative z-20 -mt-12">
        <h3 className="text-xl font-bold font-display mb-2 text-white group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
