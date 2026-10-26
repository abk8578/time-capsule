"use client";

import React from "react";
import CapsuleHero3D from "./CapsuleHero3D";

export interface CapsuleSceneProps {
  lidOpenProgress?: number;
  pointerPos?: { x: number; y: number };
  isOnScreen?: boolean;
}

export default function CapsuleScene({
  lidOpenProgress = 0,
}: CapsuleSceneProps) {
  return <CapsuleHero3D lidOpenProgress={lidOpenProgress} />;
}
