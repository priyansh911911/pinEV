"use client";

import Header from "@/components/custom/header";
import Transition from "@/components/custom/transition";
import { Icons } from "@/components/icons";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React from "react";

const Notifications = () => {
  const router = useRouter();

  return (
    <Transition>
      <Header
        left={
          <Button onClick={() => router.back()} variant="link" className="p-0 m-0">
            <Icons.ArrowLeftIcon />
          </Button>
        }
        headerBackground="bg-gradient-to-b from-background via-background to-transparent"
      >
        <h1 className="line-clamp-1 text-lg font-semibold pr-10">Notifications</h1>
      </Header>
      <Layout fullWidth className="h-svh flex flex-col justify-between">
        <div className="default-page-width w-full py-8 pt-20">
          <p>No Notifications</p>
        </div>
        <div className="h-40"></div>
      </Layout>
    </Transition>
  );
};

export default Notifications;
