import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brew Haven — Specialty Coffee & Cozy Café" },
      {
        name: "description",
        content:
          "Brew Haven is a cozy specialty coffee shop serving hand-crafted espresso, slow-pour coffee, and fresh pastries.",
      },
    ],
  }),
  component: Index,
});

// The Brew Haven site is a standalone HTML/CSS/JS project served
// from /brewhaven/. We redirect the app root to it so the preview
// opens the site directly.
function Index() {
  useEffect(() => {
    window.location.replace("/brewhaven/index.html");
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f6efe4", color: "#3b2a1e", fontFamily: "system-ui, sans-serif" }}>
      <a href="/brewhaven/index.html">Open Brew Haven →</a>
    </div>
  );
}
