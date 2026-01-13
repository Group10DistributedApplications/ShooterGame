import React from "react";
import ServerRow from "./ServerRow";

type Props = {
  items: string[];
  onUse: (u: string) => void;
  onRemove: (u: string) => void;
};

export default function ServerList({ items, onUse, onRemove }: Props) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Recent Servers</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((r) => (
          <ServerRow key={r} url={r} onUse={onUse} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
