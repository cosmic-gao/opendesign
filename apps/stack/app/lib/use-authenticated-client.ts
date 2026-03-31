import { contract } from "@/client/contract";
import { useAuth } from "@clerk/nextjs";
import { initClient } from "@ts-rest/core";
import { useMemo } from "react";

export function useAuthenticatedClient() {
  const { getToken } = useAuth();

  const client = useMemo(async () => {
    const token = await getToken();
    return initClient(contract, {
      baseUrl: `/api`,
      baseHeaders: { authorization: `Bearer ${token}` },
    });
  }, [getToken]);

  return client;
}
