import type { Festival } from "@/lib/festivals";
import { breakaway2026 } from "./breakaway";
import { coachella2026 } from "./coachella";
import { edc2025, edc2026 } from "./edc";
import { electricForest2026 } from "./electricforest";
import { escape2022, escape2026 } from "./escape";
import { outsideLands2026 } from "./outsidelands";
import { tomorrowland2026 } from "./tomorrowland";
import { ultra2026 } from "./ultra";
import { wobbleland2025, wobbleland2026 } from "./wobbleland";

// To add a festival: create/extend a file in this folder, then list it here.
export const ALL_FESTIVALS: Festival[] = [
  breakaway2026,
  coachella2026,
  edc2025,
  edc2026,
  electricForest2026,
  escape2022,
  escape2026,
  outsideLands2026,
  tomorrowland2026,
  ultra2026,
  wobbleland2025,
  wobbleland2026,
];
