"use client";
import { authClient } from "@/lib/auth-client";
import { Button } from "@workspace/ui/components/button";


export default function Page() {
  const handleSignin = async () => {
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
      })
    } catch (error) {
      console.error("Failed to signin with github", error);
    }
  }
  return (
    <div>
      <Button onClick={handleSignin}>Sign with github</Button>
    </div>
  )
}