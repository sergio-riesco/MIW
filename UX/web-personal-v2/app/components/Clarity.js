"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

// Microsoft Clarity (mapas de calor y grabaciones de sesión) para las
// pruebas de usabilidad de UX, con el paquete oficial @microsoft/clarity.
// ID del proyecto en clarity.microsoft.com (Settings > Setup).
const CLARITY_ID = "zemzo0thmt";

export default function ClarityAnalytics() {
  useEffect(() => {
    Clarity.init(CLARITY_ID);
  }, []);

  return null;
}
