'use client';
import {motion} from 'framer-motion';
export default function MotionSection({children,className=''}){return <motion.section className={className} initial={{opacity:0,y:28}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.18}} transition={{duration:.55,ease:[.22,1,.36,1]}}>{children}</motion.section>}
