import React from "react";
import { stripProtocolPort } from "./lobbyUtils";
import { serverRow, serverIcon, smallButton, removeButton } from "./lobbyStyles";

type Props = {
  url: string;
  onUse: (u: string) => void;
  onRemove: (u: string) => void;
};

export default function ServerRow({ url, onUse, onRemove }: Props) {
  const label = stripProtocolPort(url);
  return (
    <div style={serverRow}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, cursor: "pointer" }} onClick={() => onUse(url)}>
        <div style={serverIcon}>{label[0]?.toUpperCase()}</div>
        <div style={{ fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => onUse(url)} style={smallButton}>Join</button>
        <button onClick={() => onRemove(url)} aria-label="remove" style={removeButton}>✕</button>
      </div>
    </div>
  );
}
