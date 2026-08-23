import Image from "next/image";
import Link from "next/link";

export const SiteHeader = () => (
  <header className="mx-auto flex w-full max-w-[980px] items-center justify-between px-6 py-6 sm:px-0">
    <Link href="/" aria-label="Declare home">
      <Image src="/slatelogo.png" alt="Slate" width={112} height={32} priority className="h-7 w-auto" />
    </Link>

    <nav className="flex items-center gap-5 text-sm font-medium text-zinc-700">
      <a href="#how-it-works" className="hidden hover:text-black sm:block">How it works</a>
      <a href="#about" className="hidden hover:text-black sm:block">About</a>
      <Link href="/dashboard" className="rounded-full bg-zinc-900 px-4 py-2 text-white transition hover:bg-zinc-700">
        Get started
      </Link>
    </nav>
  </header>
);
