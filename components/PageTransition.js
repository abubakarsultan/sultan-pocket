'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

const walletPrefixes = ['/expense-tracker', '/dashboard/wallet'];

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const isWallet = walletPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isWallet) return children;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
