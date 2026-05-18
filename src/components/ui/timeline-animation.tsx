import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface TimelineContentProps extends HTMLMotionProps<"div"> {
  animationNum?: number;
  timelineRef?: React.RefObject<HTMLElement | null>;
  customVariants?: any;
  as?: any;
}

export const TimelineContent: React.FC<TimelineContentProps> = ({
  children,
  animationNum = 0,
  timelineRef,
  customVariants,
  as: Component = "div",
  className,
  ...props
}) => {
  const MotionComponent = (motion as any)[Component] || motion.div;

  return (
    <MotionComponent
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={customVariants}
      custom={animationNum}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};
