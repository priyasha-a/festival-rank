import { notFound } from "next/navigation";
import { SwitchPanel } from "@/components/SwitchFestival";
import { FESTIVALS, getFestival } from "@/lib/festivals";

export function generateStaticParams() {
  return FESTIVALS.map((f) => ({ id: f.id }));
}

/** Moves a festival the user added themselves onto this official one (/festival/[id]/switch?from=custom-…). */
export default async function SwitchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const festival = getFestival(id);
  if (!festival) notFound();
  // Needs the full lineup to match the artists they typed against it.
  return <SwitchPanel festival={festival} />;
}
