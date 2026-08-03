import { describe, expect, it } from "vitest"
import { recommendLevel, type LevelEvidenceInput } from "./level-engine"

const STRONG: LevelEvidenceInput = {
  currentLevel: "BEGINNER",
  vocabulary: { attempts: 20, averageScore: 85 },
  grammar: { attempts: 15, averageScore: 80 },
  listening: { attempts: 10, averageScore: 75 },
  speaking: { attempts: 10, averageScore: 78 },
  workplaceCommunication: { attempts: 8, averageScore: 82 },
}

describe("recommendLevel", () => {
  it("suggests an upgrade when there is strong, sufficient evidence across categories", () => {
    const rec = recommendLevel(STRONG)
    expect(rec.upgradeAvailable).toBe(true)
    expect(rec.suggestedLevel).toBe("INTERMEDIATE")
    expect(rec.reason).toMatch(/ready for INTERMEDIATE/)
  })

  it("does not suggest an upgrade with too few total attempts", () => {
    const rec = recommendLevel({
      ...STRONG,
      vocabulary: { attempts: 2, averageScore: 90 },
      grammar: { attempts: 2, averageScore: 90 },
      listening: { attempts: 1, averageScore: 90 },
      speaking: { attempts: 1, averageScore: 90 },
      workplaceCommunication: { attempts: 1, averageScore: 90 },
    })
    expect(rec.upgradeAvailable).toBe(false)
    expect(rec.suggestedLevel).toBeNull()
    expect(rec.missingEvidence.join(" ")).toMatch(/total practice attempts/)
  })

  it("requires attempts in at least three categories", () => {
    const rec = recommendLevel({
      currentLevel: "BEGINNER",
      vocabulary: { attempts: 30, averageScore: 95 },
      grammar: { attempts: 0, averageScore: 0 },
      listening: { attempts: 0, averageScore: 0 },
      speaking: { attempts: 0, averageScore: 0 },
      workplaceCommunication: { attempts: 0, averageScore: 0 },
    })
    expect(rec.upgradeAvailable).toBe(false)
    expect(rec.missingEvidence.join(" ")).toMatch(/more attempts in/)
  })

  it("blocks an upgrade when one major category is far below the target despite a good average", () => {
    const rec = recommendLevel({
      ...STRONG,
      grammar: { attempts: 15, averageScore: 10 },
    })
    expect(rec.upgradeAvailable).toBe(false)
    expect(rec.missingEvidence.join(" ")).toMatch(/stronger grammar/)
  })

  it("requires the weighted score to clear the upgrade threshold", () => {
    const rec = recommendLevel({
      currentLevel: "BEGINNER",
      vocabulary: { attempts: 10, averageScore: 50 },
      grammar: { attempts: 10, averageScore: 50 },
      listening: { attempts: 10, averageScore: 50 },
      speaking: { attempts: 10, averageScore: 50 },
      workplaceCommunication: { attempts: 10, averageScore: 50 },
    })
    expect(rec.upgradeAvailable).toBe(false)
    expect(rec.weightedScore).toBe(50)
  })

  it("never suggests a level below the current one", () => {
    const rec = recommendLevel({ ...STRONG, currentLevel: "ADVANCED" })
    expect(rec.suggestedLevel).toBeNull()
    expect(rec.upgradeAvailable).toBe(false)
    expect(rec.reason).toMatch(/highest level/)
  })

  it("is case-insensitive about the current level and defaults unknown values to BEGINNER", () => {
    const rec = recommendLevel({ ...STRONG, currentLevel: "beginner" })
    expect(rec.suggestedLevel).toBe("INTERMEDIATE")
  })
})
