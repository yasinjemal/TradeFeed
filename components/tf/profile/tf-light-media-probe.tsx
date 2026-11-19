"use client";

import * as React from "react";

// ============================================================
// TfLightMediaProbe — renders nothing, ever.
//
// navigator.connection.saveData cannot be read during a server
// render, so nothing above the fold can branch on it. This sets
// data-light-media on <html> after mount, which CSS uses to drop
// below-the-fold ambience for buyers who asked their phone to
// save data. Above the fold the profile needs no branch at all,
// because it has no decorative image to suppress.
// ============================================================

interface SaveDataConnection {
  saveData?: boolean;
}

export function TfLightMediaProbe() {
  React.useEffect(() => {
    const connection = (
      navigator as Navigator & { connection?: SaveDataConnection }
    ).connection;
    if (connection?.saveData) {
      document.documentElement.setAttribute("data-light-media", "true");
    }
    return () => {
      document.documentElement.removeAttribute("data-light-media");
    };
  }, []);

  return null;
}
