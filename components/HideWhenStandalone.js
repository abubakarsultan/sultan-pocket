'use client';
import { useStandalone } from '@/lib/useStandalone';

export default function HideWhenStandalone({ children }) {
  const standalone = useStandalone();
  if (standalone) return null;
  return children;
}
