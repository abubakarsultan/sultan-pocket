'use client';
import Link from 'next/link';
import {motion} from 'framer-motion';
import SpotlightCard from '@/components/SpotlightCard';
export default function BentoFeatures({features}){return <div className="feature-bento-grid">{features.map((feature,i)=><SpotlightCard key={feature.title}><motion.div initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.2}} transition={{duration:.4,delay:i*.04}}><Link href={feature.href} className={`feature-card feature-bento-card feature-bento-${i}`}><span className="feature-icon">{feature.icon}</span><h3>{feature.title}</h3><p>{feature.desc}</p><span className="feature-link">Explore →</span></Link></motion.div></SpotlightCard>)}</div>}
