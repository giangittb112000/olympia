"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import clsx from "clsx";

interface RoleCardProps {
  title: string;
  description: string;
  href: string;
  color: "gold" | "cyan" | "slate";
  icon?: React.ReactNode;
}

export function RoleCard({ title, description, href, color, icon, onClick }: RoleCardProps & { onClick?: () => void }) {
  const colorStyles = {
    gold: "border-amber-500/50 hover:border-amber-400 text-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]",
    cyan: "border-cyan-500/50 hover:border-cyan-400 text-cyan-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]",
    slate: "border-slate-500/50 hover:border-slate-400 text-slate-300 hover:shadow-[0_0_30px_rgba(148,163,184,0.3)]",
  };

  const Content = (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className={clsx(
        "relative h-64 p-8 rounded-2xl border-2 backdrop-blur-md bg-black/40 transition-all duration-300 flex flex-col items-center justify-center text-center group cursor-pointer",
        colorStyles[color]
      )}
    >
      <div className="mb-4 text-4xl">{icon}</div>
      <h2 className="text-3xl font-bold uppercase tracking-wider mb-2 font-display">
        {title}
      </h2>
      <p className="text-sm font-light text-slate-300 opacity-80 group-hover:opacity-100 transition-opacity">
        {description}
      </p>
      
      {/* Glow effect element */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="block w-full max-w-sm">
        {Content}
      </div>
    );
  }

  return (
    <Link href={href || "#"} className="block w-full max-w-sm">
      {Content}
    </Link>
  );
}
