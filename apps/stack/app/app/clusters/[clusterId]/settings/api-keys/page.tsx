import { ApiKeys } from "@/components/api-keys";

export default function ApiKeysPage({
  params: { clusterId },
}: {
  params: { clusterId: string };
}) {
  return <ApiKeys clusterId={clusterId} />;
}
