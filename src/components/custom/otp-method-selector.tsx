"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

interface OtpMethodSelectorProps {
  onMethodSelect: (method: "email" | "sms") => void;
  userEmail?: string;
  userPhone?: string;
}

export default function OtpMethodSelector({ onMethodSelect, userEmail, userPhone }: OtpMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<"email" | "sms" | null>(null);

  const handleMethodSelect = (method: "email" | "sms") => {
    setSelectedMethod(method);
    onMethodSelect(method);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold">Choose OTP delivery method:</p>
      
      <div className="space-y-3">
        {userEmail && (
          <Button
            variant={selectedMethod === "email" ? "default" : "outline"}
            className="w-full justify-start gap-3"
            onClick={() => handleMethodSelect("email")}
          >
            <Icons.MailIcon className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Email</p>
              <p className="text-sm opacity-70">{userEmail}</p>
            </div>
          </Button>
        )}
        
        {userPhone && (
          <Button
            variant={selectedMethod === "sms" ? "default" : "outline"}
            className="w-full justify-start gap-3"
            onClick={() => handleMethodSelect("sms")}
          >
            <Icons.PhoneIcon className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">SMS</p>
              <p className="text-sm opacity-70">{userPhone}</p>
            </div>
          </Button>
        )}
      </div>
    </div>
  );
}