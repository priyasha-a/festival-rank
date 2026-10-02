import { notFound } from "next/navigation";
import { SwitchPanel } from "@/components/SwitchFestival";
import { getFestival } from "@/lib/catalog";

/** Moves a festival the user added themselves onto this official one (/festival/[id]/switch?from=custom-…). */
export default async function SwitchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const festival = await getFestival(id);
  if (!festival) notFound();
  // Needs the full lineup to match the artists they typed against it.
  return <SwitchPanel festival={festival} />;
}
