import React from "react";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  padding?: "none" | "sm" | "md" | "lg";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

const paddingClasses = {
  none: "px-0",
  sm: "px-4 sm:px-6",
  md: "px-4 sm:px-6 lg:px-8",
  lg: "px-4 sm:px-6 lg:px-8 xl:px-12",
};

export default function ResponsiveContainer({
  children,
  className = "",
  maxWidth = "2xl",
  padding = "md",
}: ResponsiveContainerProps) {
  return (
    <div
      className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: "sm" | "md" | "lg";
  className?: string;
}

const gapClasses = {
  sm: "gap-2 sm:gap-3",
  md: "gap-4 sm:gap-6",
  lg: "gap-6 sm:gap-8",
};

export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "md",
  className = "",
}: ResponsiveGridProps) {
  const gridClass = `grid grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop} ${gapClasses[gap]}`;

  return <div className={`${gridClass} ${className}`}>{children}</div>;
}

interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  weight?: "light" | "normal" | "semibold" | "bold";
  className?: string;
}

const textSizeClasses = {
  xs: "text-xs sm:text-sm",
  sm: "text-sm sm:text-base",
  base: "text-base sm:text-lg",
  lg: "text-lg sm:text-xl",
  xl: "text-xl sm:text-2xl",
  "2xl": "text-2xl sm:text-3xl",
};

const textWeightClasses = {
  light: "font-light",
  normal: "font-normal",
  semibold: "font-semibold",
  bold: "font-bold",
};

export function ResponsiveText({
  children,
  size = "base",
  weight = "normal",
  className = "",
}: ResponsiveTextProps) {
  return (
    <span className={`${textSizeClasses[size]} ${textWeightClasses[weight]} ${className}`}>
      {children}
    </span>
  );
}

interface ResponsivePaddingProps {
  children: React.ReactNode;
  y?: "sm" | "md" | "lg" | "xl";
  x?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const paddingYClasses = {
  sm: "py-2 sm:py-3",
  md: "py-4 sm:py-6",
  lg: "py-6 sm:py-8",
  xl: "py-8 sm:py-12",
};

const paddingXClasses = {
  sm: "px-2 sm:px-3",
  md: "px-4 sm:px-6",
  lg: "px-6 sm:px-8",
  xl: "px-8 sm:px-12",
};

export function ResponsivePadding({
  children,
  y = "md",
  x = "md",
  className = "",
}: ResponsivePaddingProps) {
  return (
    <div className={`${paddingYClasses[y]} ${paddingXClasses[x]} ${className}`}>
      {children}
    </div>
  );
}

// Hook for responsive breakpoints
export function useResponsive() {
  const [screenSize, setScreenSize] = React.useState<
    "mobile" | "tablet" | "desktop"
  >("desktop");

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setScreenSize("mobile");
      } else if (window.innerWidth < 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    screenSize,
    isMobile: screenSize === "mobile",
    isTablet: screenSize === "tablet",
    isDesktop: screenSize === "desktop",
  };
}
