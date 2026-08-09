import Image from "next/image";
import { cn } from "@/lib/utils";

export function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center", compact ? "gap-1" : "gap-2")}>
      <Image src="/images/logo.png" alt="Aturservicett" width={compact ? 72 : 88} height={compact ? 72 : 88} priority className="rounded-[18%]" />
      <div className="text-center">
        <div className={cn("text-xl font-extrabold", light ? "text-white" : "text-[#171717]")}>Aturservice<span className="text-[#dc5a45]">tt</span></div>
        <div className={cn("mt-0.5 text-[10px] font-medium", light ? "text-white" : "text-[#282828]")}>Skilled professional at your service</div>
      </div>
    </div>
  );
}
