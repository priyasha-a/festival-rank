import type { Festival } from "@/lib/festivals";
import { audiotistic2019, audiotistic2022 } from "./audiotistic";
import { breakaway2025, breakaway2026 } from "./breakaway";
import { coachella2022, coachella2023, coachella2024, coachella2025, coachella2026 } from "./coachella";
import { edc2022, edc2023, edc2024, edc2025, edc2026 } from "./edc";
import {
  electricForest2022,
  electricForest2023,
  electricForest2024,
  electricForest2025,
  electricForest2026,
} from "./electricforest";
import { escape2022, escape2023, escape2024, escape2025, escape2026 } from "./escape";
import { lightning2022, lightning2023, lightning2024, lightning2025, lightning2026 } from "./lightning";
import {
  lollapalooza2022,
  lollapalooza2023,
  lollapalooza2024,
  lollapalooza2025,
  lollapalooza2026,
} from "./lollapalooza";
import {
  outsideLands2019,
  outsideLands2021,
  outsideLands2022,
  outsideLands2023,
  outsideLands2024,
  outsideLands2025,
  outsideLands2026,
} from "./outsidelands";
import { portola2022, portola2023, portola2024, portola2025, portola2026 } from "./portola";
import {
  tomorrowland2022,
  tomorrowland2023,
  tomorrowland2024,
  tomorrowland2025,
  tomorrowland2026,
} from "./tomorrowland";
import { ultra2022, ultra2023, ultra2024, ultra2025, ultra2026 } from "./ultra";
import { wobbleland2022, wobbleland2024, wobbleland2025, wobbleland2026 } from "./wobbleland";

// To add a festival: create/extend a file in this folder, then list it here. Order doesn't matter;
// the app sorts newest first and groups years by festival name.
export const ALL_FESTIVALS: Festival[] = [
  audiotistic2019,
  audiotistic2022,
  breakaway2025,
  breakaway2026,
  coachella2022,
  coachella2023,
  coachella2024,
  coachella2025,
  coachella2026,
  edc2022,
  edc2023,
  edc2024,
  edc2025,
  edc2026,
  electricForest2022,
  electricForest2023,
  electricForest2024,
  electricForest2025,
  electricForest2026,
  escape2022,
  escape2023,
  escape2024,
  escape2025,
  escape2026,
  lightning2022,
  lightning2023,
  lightning2024,
  lightning2025,
  lightning2026,
  lollapalooza2022,
  lollapalooza2023,
  lollapalooza2024,
  lollapalooza2025,
  lollapalooza2026,
  outsideLands2019,
  outsideLands2021,
  outsideLands2022,
  outsideLands2023,
  outsideLands2024,
  outsideLands2025,
  outsideLands2026,
  portola2022,
  portola2023,
  portola2024,
  portola2025,
  portola2026,
  tomorrowland2022,
  tomorrowland2023,
  tomorrowland2024,
  tomorrowland2025,
  tomorrowland2026,
  ultra2022,
  ultra2023,
  ultra2024,
  ultra2025,
  ultra2026,
  wobbleland2022,
  wobbleland2024,
  wobbleland2025,
  wobbleland2026,
];
