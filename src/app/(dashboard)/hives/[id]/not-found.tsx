import Link from "next/link";
import { Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HiveNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Hexagon className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-2xl font-bold">Hive Not Found</h1>
      <p className="text-muted-foreground">This hive doesn't exist or you don't have access.</p>
      <Link href="/hives">
        <Button>Back to Hives</Button>
      </Link>
    </div>
  );
}
