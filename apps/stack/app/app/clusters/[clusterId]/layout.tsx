import { ClusterBreadcrumbs } from "@/components/breadcrumbs";

export default async function Layout({
  children,
  params: { clusterId },
}: {
  children: React.ReactNode;
  params: { clusterId: string };
}) {
  return (
    <>
      <ClusterBreadcrumbs clusterId={clusterId} />
      {children}
    </>
  );
}
