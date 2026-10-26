import type { IGameEngine, GameType, EngineContext } from "./types";
import type { GeneratedSessionPack } from "../schema";
import { MonopolyEngine } from "./MonopolyEngine";
import { LudoEngine } from "./LudoEngine";
import { UnoEngine } from "./UnoEngine";
import { SnakesLaddersEngine } from "./SnakesLaddersEngine";
import { TerritoryEngine } from "./TerritoryEngine";
import { MafiaEngine } from "./MafiaEngine";
import { ConnectFourEngine } from "./ConnectFourEngine";
import { CheckersEngine } from "./CheckersEngine";
import { BingoEngine } from "./BingoEngine";
import { GenericBoardEngine } from "./GenericBoardEngine";

export class GameEngineRegistry {
  /**
   * Detects the authentic game type based on session pack characteristics
   */
  public static detectGameType(pack: GeneratedSessionPack | any): GameType {
    if (pack.unoState) {
      return "UNO";
    }
    if (pack.isLudo || pack.ludoState) {
      return "LUDO";
    }

    const key = (pack as any).key || (pack as any).gameKey || "";
    const themeId = pack.themeId || "";
    const title = pack.themeTitle || "";
    const mechanism = pack.rulesConfig?.turnMechanism;
    const ownership = pack.rulesConfig?.ownershipSystem;
    const archetype = pack.archetype;
    const tilesCount = pack.tiles?.length || pack.boardSize || 0;

    // 0. New viral arcade games own their dedicated state and rules.
    if (
      key === "CONNECT_FOUR" ||
      (pack as any).connectFourState ||
      mechanism === "GRID_PLACEMENT"
    ) {
      return "CONNECT_FOUR";
    }
    if (
      key === "CHECKERS_CLASSIC" ||
      (pack as any).checkersState ||
      mechanism === "CHECKERS_MOVE"
    ) {
      return "CHECKERS";
    }
    if (
      key === "BINGO_NIGHT" ||
      (pack as any).bingoState ||
      mechanism === "BINGO_CALL"
    ) {
      return "BINGO";
    }

    // 0b. Social deduction (Mafia) and territory conquest (Risk) own their rules
    if (
      key === "SOCIAL_MAFIA_SPY" ||
      (pack as any).mafiaState ||
      archetype === "SOCIAL_DEDUCTION" ||
      mechanism === "SOCIAL_DISCUSSION_VOTE"
    ) {
      return "MAFIA";
    }

    if (
      key === "WORLD_CONQUEST_RISK" ||
      (pack as any).territoryState ||
      ownership === "CONQUER_REGIONS" ||
      mechanism === "TERRITORY_COMMAND"
    ) {
      return "RISK";
    }

    // 1. Ludo / Jackaroo
    if (
      key === "LUDO_CLASSIC" ||
      themeId.includes("LUDO") ||
      title.includes("لودو") ||
      title.includes("Ludo") ||
      title.includes("جاكارو") ||
      (archetype === "BOARD_RACE" && mechanism === "DICE_AND_MOVE" && pack.winCondition === "FIRST_TO_FINISH" && !title.includes("سلم") && !title.includes("ثعبان") && tilesCount !== 100)
    ) {
      return "LUDO";
    }

    // 2. UNO / Tactical Card Battler
    if (
      key === "TACTICAL_CARDS_UNO" ||
      themeId === "TACTICAL_CARDS_UNO" ||
      title.includes("أونو") ||
      title.includes("Uno") ||
      title.includes("UNO")
    ) {
      return "UNO";
    }

    // 3. Snakes & Ladders
    if (
      key === "SNAKES_AND_LADDERS_RPG" ||
      tilesCount === 100 ||
      title.includes("سلم") ||
      title.includes("ثعبان") ||
      title.includes("Snakes")
    ) {
      return "SNAKES_AND_LADDERS";
    }

    // 4. Monopoly
    if (
      key === "MONOPOLY_CLASSIC" ||
      key === "RIYADH_VIP" ||
      themeId === "MONOPOLY_CLASSIC" ||
      themeId === "RIYADH_VIP" ||
      ownership === "BUY_AND_RENT" ||
      title.includes("مونوبولي") ||
      title.includes("Monopoly") ||
      title.includes("عقارات")
    ) {
      return "MONOPOLY";
    }

    // 5. Generic / Legacy Board
    return "GENERIC_BOARD";
  }

  /**
   * Factory method to instantiate the dedicated engine
   */
  public static createEngine(gameType: GameType, ctx: EngineContext): IGameEngine {
    switch (gameType) {
      case "MONOPOLY":
        return new MonopolyEngine(ctx);
      case "LUDO":
        return new LudoEngine(ctx);
      case "UNO":
        return new UnoEngine(ctx);
      case "SNAKES_AND_LADDERS":
        return new SnakesLaddersEngine(ctx);
      case "RISK":
        return new TerritoryEngine(ctx);
      case "MAFIA":
        return new MafiaEngine(ctx);
      case "CONNECT_FOUR":
        return new ConnectFourEngine(ctx);
      case "CHECKERS":
        return new CheckersEngine(ctx);
      case "BINGO":
        return new BingoEngine(ctx);
      case "GENERIC_BOARD":
      default:
        return new GenericBoardEngine(ctx);
    }
  }
}
