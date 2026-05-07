"use client";
import { Comparison } from "@/components/landing/comparison";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { Process } from "@/components/landing/process";
import { SelfHost } from "@/components/landing/selfhost";
import { authClient } from "@/lib/auth-client";

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
      <Navbar onSignIn={handleSignin} />
      <Hero onSignIn={handleSignin} />
      <Process />
      <Features />
      <Comparison />
    </div>
  )
}