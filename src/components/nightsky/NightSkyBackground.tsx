"use client";

import React from "react";
import dynamic from "next/dynamic";

const NightSkyCanvas = dynamic(() => import("./NightSkyCanvas"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#03060E] -z-10" />,
});

export default function NightSkyBackground() {
  return <NightSkyCanvas />;
}
