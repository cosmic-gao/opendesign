"use client";

import { Loading } from "@/components/loading";
import { useEffect } from "react";

export default function SwitchOrgPage() {
  useEffect(() => {
    window.location.reload();
    window.location.href = "/clusters";
  }, []);

  return <Loading />;
}
