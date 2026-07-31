import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_NEEDS, type NeedsProfile } from "@attune/shared";
import { rankCandidates, scorePair } from "./score";

function needs(partial: Partial<NeedsProfile> = {}): NeedsProfile {
  return { ...DEFAULT_NEEDS, ...partial };
}

describe("scorePair", () => {
  it("scores identical needs highly", () => {
    const a = { userId: "a", needs: needs(), specialInterests: ["trains", "coding"] };
    const b = { userId: "b", needs: needs(), specialInterests: ["trains", "cats"] };
    const score = scorePair(a, b);
    assert.equal(score.dealbreakerBlocked, false);
    assert.ok(score.total >= 80);
  });

  it("scores divergent sensory needs lower", () => {
    const quiet = {
      userId: "a",
      needs: needs({
        noiseSensitivity: 95,
        crowdTolerance: 10,
        lightSensitivity: 90,
      }),
      specialInterests: [],
    };
    const loud = {
      userId: "b",
      needs: needs({
        noiseSensitivity: 5,
        crowdTolerance: 95,
        lightSensitivity: 10,
        preferredEnvironments: ["low_key_dinner"],
      }),
      specialInterests: [],
    };
    const score = scorePair(quiet, loud);
    assert.ok(score.total < 75);
  });
});

describe("rankCandidates", () => {
  it("orders by score descending", () => {
    const viewer = {
      userId: "me",
      needs: needs({ intents: ["romance"] }),
      specialInterests: ["astronomy"],
    };
    const ranked = rankCandidates(viewer, [
      {
        userId: "far",
        needs: needs({
          noiseSensitivity: 5,
          crowdTolerance: 95,
          intents: ["friendship"],
        }),
        specialInterests: [],
      },
      {
        userId: "near",
        needs: needs({ intents: ["romance", "slow_burn"] }),
        specialInterests: ["astronomy"],
      },
    ]);
    assert.equal(ranked[0]?.userId, "near");
  });
});
