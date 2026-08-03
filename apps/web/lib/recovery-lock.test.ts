/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from "vitest"

import { clearRecoveryLock, hasRecoveryLockCredential, isRecoveryUnlocked, lockRecovery, setRecoveryPin, unlockRecovery } from "./recovery-lock"

describe("local Recovery Lock", () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear() })

  it("stores a derived verifier rather than the raw PIN", async () => {
    await setRecoveryPin("4826")
    expect(hasRecoveryLockCredential()).toBe(true)
    expect(isRecoveryUnlocked()).toBe(true)
    expect(localStorage.getItem("hengo-recovery-lock-v1")).not.toContain("4826")
  })

  it("rejects a wrong PIN and unlocks with the correct PIN", async () => {
    await setRecoveryPin("4826")
    lockRecovery()
    expect(await unlockRecovery("1111")).toBe(false)
    expect(await unlockRecovery("4826")).toBe(true)
    clearRecoveryLock()
    expect(hasRecoveryLockCredential()).toBe(false)
  })
})
