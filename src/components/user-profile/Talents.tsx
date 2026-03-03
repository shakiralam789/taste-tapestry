import React from "react";

export default function Talents() {
  return (
    <>
      <div className="mb-6">
        <h3 className="text-2xl font-display font-bold">Hidden talents</h3>
        <p className="text-muted-foreground text-sm">
          Reveal your secret skills — singing, dancing, writing, art, acting,
          stunts.
        </p>
      </div>
      <div className="py-10 px-4 rounded-2xl border border-dashed border-white/10 bg-card/20 text-center text-muted-foreground text-sm">
        No talents revealed yet.
      </div>
    </>
  );
}
