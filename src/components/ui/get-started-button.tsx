import { Button, ButtonProps } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GetStartedButtonProps extends ButtonProps {
  text: string;
}

export function GetStartedButton({ text, className, ...props }: GetStartedButtonProps) {
  return (
    <Button 
      className={cn(
        "group relative overflow-hidden pr-12 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-md font-semibold text-base h-12 rounded-xl", 
        className
      )} 
      {...props}
    >
      <span className="transition-opacity duration-500 group-hover:opacity-0">
        {text}
      </span>
      <i className="absolute right-1 top-1 bottom-1 rounded-lg z-10 grid w-10 place-items-center transition-all duration-500 bg-primary-foreground/15 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95 not-italic">
        <ChevronRight size={18} strokeWidth={2.5} aria-hidden="true" />
      </i>
    </Button>
  );
}
