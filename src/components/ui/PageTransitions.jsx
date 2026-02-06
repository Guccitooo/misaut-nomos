import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const pageVariants = {
  initial: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  animate: {
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0
  })
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.3
};

export default function PageTransitions({ children }) {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        custom={1}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}