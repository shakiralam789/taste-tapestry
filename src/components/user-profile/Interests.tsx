import React from "react";

export default function Interests() {
  return (
    <>
      <div className="mb-6">
        <h3 className="text-2xl font-display font-bold">
          Interests & creative pursuits
        </h3>
        <p className="text-muted-foreground text-sm">
          Creative, performance, skill-based, and more — what drives them.
        </p>
      </div>
      <div className="py-10 px-4 rounded-2xl border border-dashed border-white/10 bg-card/20 text-center text-muted-foreground text-sm">
        No interests added yet.
      </div>
    </>
  );
}
