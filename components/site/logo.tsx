import Link from "next/link";
import { Leaf } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label="B.Brasil Higiene Profissional">
      <span className="flex h-12 w-12 items-center justify-center rounded-md bg-brand-blue text-3xl font-black text-white">B</span>
      <span className="relative leading-none">
        <span className="block text-[2rem] font-medium tracking-normal text-brand-blue">B.Brasil</span>
        <span className="block text-xs font-medium text-brand-green">Higiene Profissional</span>
        <Leaf className="absolute -right-2 -top-2 h-5 w-5 fill-brand-green text-brand-green" />
      </span>
    </Link>
  );
}
