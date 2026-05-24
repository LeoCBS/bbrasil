import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" aria-label="B.Brasil Higiene Profissional">
      <Image
        src="/logo2.png"
        alt="B.Brasil Higiene Profissional"
        width={420}
        height={120}
        priority
        className="h-auto w-[220px] object-contain"
      />
    </Link>
  );
}