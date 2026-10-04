import { RegionPolicy, RegionName } from "./types";

/**
 * ============================================================================
 *  SIMULATED POLICY DATA — EDUCATIONAL USE ONLY
 * ============================================================================
 *  Every value below is a mock weight invented for this research lab to
 *  illustrate HOW regional policy differences COULD, in principle, produce
 *  different moderation outcomes for the same content. None of these numbers
 *  come from TikTok, are derived from TikTok's real policies, or should be
 *  treated as representative of any real platform's actual rules.
 * ============================================================================
 */

const SIMULATED_NOTICE =
  "SIMULATED policy — invented for this educational lab. Not TikTok's actual rules.";

export const DEFAULT_POLICIES: Record<RegionName, RegionPolicy> = {
  Indonesia: {
    region: "Indonesia",
    brandNameSensitivity: 70,
    trademarkSensitivity: 65,
    authenticityClaimSensitivity: 80,
    liveContentRestrictionLevel: 60,
    evidenceRequirementLevel: 70,
    riskThreshold: 55,
    simulatedNotice: SIMULATED_NOTICE,
  },
  Malaysia: {
    region: "Malaysia",
    brandNameSensitivity: 55,
    trademarkSensitivity: 60,
    authenticityClaimSensitivity: 65,
    liveContentRestrictionLevel: 50,
    evidenceRequirementLevel: 55,
    riskThreshold: 60,
    simulatedNotice: SIMULATED_NOTICE,
  },
  Singapore: {
    region: "Singapore",
    brandNameSensitivity: 50,
    trademarkSensitivity: 85,
    authenticityClaimSensitivity: 60,
    liveContentRestrictionLevel: 45,
    evidenceRequirementLevel: 40,
    riskThreshold: 65,
    simulatedNotice: SIMULATED_NOTICE,
  },
  Vietnam: {
    region: "Vietnam",
    brandNameSensitivity: 60,
    trademarkSensitivity: 55,
    authenticityClaimSensitivity: 70,
    liveContentRestrictionLevel: 75,
    evidenceRequirementLevel: 65,
    riskThreshold: 50,
    simulatedNotice: SIMULATED_NOTICE,
  },
};

export function listDefaultPolicies(): RegionPolicy[] {
  return Object.values(DEFAULT_POLICIES);
}

const STORAGE_KEY = "simlab.regionPolicies.v1";

/** Reads saved policy overrides from localStorage, falling back to defaults. */
export function loadPolicies(): Record<RegionName, RegionPolicy> {
  if (typeof window === "undefined") return DEFAULT_POLICIES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POLICIES;
    const parsed = JSON.parse(raw) as Record<RegionName, RegionPolicy>;
    // Always re-stamp the simulated notice so a tampered/old save can't drop it.
    for (const region of Object.keys(parsed) as RegionName[]) {
      parsed[region].simulatedNotice = SIMULATED_NOTICE;
    }
    return { ...DEFAULT_POLICIES, ...parsed };
  } catch {
    return DEFAULT_POLICIES;
  }
}

export function savePolicies(policies: Record<RegionName, RegionPolicy>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
}

export function resetPolicies(): Record<RegionName, RegionPolicy> {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return DEFAULT_POLICIES;
}
