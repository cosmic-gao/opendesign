"use client";

import { useAuth, OrganizationSwitcher } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <CliAuth />
    </div>
  );
}

function CliAuth() {
  const { getToken, orgId, isLoaded } = useAuth();

  const handleGetToken = async () => {
    const newToken = await getToken({
      template: "extended-cli-token",
    });

    if (!newToken) {
      toast.error("Failed to get token");
      return;
    }

    const url = new URL("http://localhost:9999");
    url.searchParams.append("token", newToken);
    window.location.href = url.toString();
  };

  if (!isLoaded) {
    return <Loader className="w-10 h-10" />;
  }

  return (
    <Card className="w-[800px]">
      <CardHeader>
        <CardTitle>CLI Authentication</CardTitle>
        <CardDescription>
          Select an organization and confirm CLI authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OrganizationSwitcher
          hidePersonal={true}
          afterSelectOrganizationUrl="/cli-auth?force=true"
        />
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button onClick={handleGetToken} className="w-full" disabled={!orgId}>
          Authenticate CLI
        </Button>
      </CardFooter>
    </Card>
  );
}
