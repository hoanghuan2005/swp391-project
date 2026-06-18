import React, { useEffect } from "react";

export default function PricingPage() {
  useEffect(() => {
    window.location.replace("/#pricing");
  }, []);

  return null;
}
