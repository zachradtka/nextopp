import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="flex flex-col items-center py-12 text-center sm:py-16">
      <Link href="/login">
        <Button size="lg" className="h-11 px-6 text-base">
          Get started
        </Button>
      </Link>
    </section>
  );
}
