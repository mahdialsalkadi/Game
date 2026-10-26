"use client";

import React from "react";
import type { GameTableProps } from "./types";
import { detectRulebookId } from "@/game/rulebooks";
import MonopolyTable from "./MonopolyTable";
import LudoTable from "./LudoTable";
import UnoTable from "./UnoTable";
import SnakesTable from "./SnakesTable";
import RiskTable from "./RiskTable";
import MafiaTable from "./MafiaTable";
import ConnectFourTable from "./ConnectFourTable";
import CheckersTable from "./CheckersTable";
import BingoTable from "./BingoTable";
import GenericTable from "./GenericTable";

/**
 * موجّه الطاولات: كل لعبة لها شاشة عرض ومكوّنات وواجهة مستقلة.
 * لا يوجد قالب واحد يفرض شريطاً/تخطيطاً على الجميع — فقط هذا السويتش.
 */
export default function GameTables(props: GameTableProps) {
  const rulebookId = detectRulebookId(props.gameState);

  switch (rulebookId) {
    case "MONOPOLY":
      return <MonopolyTable {...props} />;
    case "LUDO":
      return <LudoTable {...props} />;
    case "UNO":
      return <UnoTable {...props} />;
    case "SNAKES_AND_LADDERS":
      return <SnakesTable {...props} />;
    case "RISK":
      return <RiskTable {...props} />;
    case "MAFIA":
      return <MafiaTable {...props} />;
    case "CONNECT_FOUR":
      return <ConnectFourTable {...props} />;
    case "CHECKERS":
      return <CheckersTable {...props} />;
    case "BINGO":
      return <BingoTable {...props} />;
    default:
      return <GenericTable {...props} />;
  }
}
