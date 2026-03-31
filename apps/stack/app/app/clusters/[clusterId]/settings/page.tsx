import { redirect } from "next/navigation";

export const metadata = {
  title: "ClusterSettings",
};

export default function SettingsPage({
  params: { clusterId },
}: {
  params: { clusterId: string };
}) {
  redirect(`/clusters/${clusterId}/settings/details`);
}
