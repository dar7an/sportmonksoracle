/**
 * Oracle match-status and outcome codes (signing contract v1.1).
 *
 * Sportmonks cricket statuses are documented at:
 * https://docs.sportmonks.com/v2/cricket-api/statuses-and-definitions
 *
 * Unknown Sportmonks strings must not be signed. Callers convert
 * {@link UnknownSportmonksStatusError} into HTTP 502.
 */

export const MATCH_STATUS = {
    NOT_STARTED: 1,
    IN_PROGRESS: 2,
    FINISHED: 3,
    CANCELLED: 4,
    POSTPONED: 5,
    ABANDONED: 6,
} as const;

export type MatchStatusCode = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];

export const MATCH_OUTCOME = {
    NONE: 0,
    WINNER: 1,
    DRAW: 2,
    NO_RESULT: 3,
} as const;

export type MatchOutcomeCode = (typeof MATCH_OUTCOME)[keyof typeof MATCH_OUTCOME];

export const MATCH_STATUS_LABEL: Record<MatchStatusCode, string> = {
    [MATCH_STATUS.NOT_STARTED]: "Not started",
    [MATCH_STATUS.IN_PROGRESS]: "In progress",
    [MATCH_STATUS.FINISHED]: "Finished",
    [MATCH_STATUS.CANCELLED]: "Cancelled",
    [MATCH_STATUS.POSTPONED]: "Postponed",
    [MATCH_STATUS.ABANDONED]: "Abandoned",
};

export const MATCH_OUTCOME_LABEL: Record<MatchOutcomeCode, string> = {
    [MATCH_OUTCOME.NONE]: "None / unknown",
    [MATCH_OUTCOME.WINNER]: "Winner",
    [MATCH_OUTCOME.DRAW]: "Draw",
    [MATCH_OUTCOME.NO_RESULT]: "No result",
};

/**
 * Official Sportmonks Cricket v2 status strings → oracle codes.
 *
 * The docs table writes `Cancl`. with the period outside the code span;
 * the live API uses `Cancl.`. Both map to cancelled. No other cancelled
 * aliases exist — `Aban.` is abandoned (6), `Postp.` is postponed (5).
 */
export const SPORTMONKS_STATUS_MAP = {
    NS: MATCH_STATUS.NOT_STARTED,
    Delayed: MATCH_STATUS.NOT_STARTED,
    "1st Innings": MATCH_STATUS.IN_PROGRESS,
    "2nd Innings": MATCH_STATUS.IN_PROGRESS,
    "3rd Innings": MATCH_STATUS.IN_PROGRESS,
    "4th Innings": MATCH_STATUS.IN_PROGRESS,
    "Innings Break": MATCH_STATUS.IN_PROGRESS,
    "Int.": MATCH_STATUS.IN_PROGRESS,
    "Stump Day 1": MATCH_STATUS.IN_PROGRESS,
    "Stump Day 2": MATCH_STATUS.IN_PROGRESS,
    "Stump Day 3": MATCH_STATUS.IN_PROGRESS,
    "Stump Day 4": MATCH_STATUS.IN_PROGRESS,
    "Tea Break": MATCH_STATUS.IN_PROGRESS,
    Lunch: MATCH_STATUS.IN_PROGRESS,
    Dinner: MATCH_STATUS.IN_PROGRESS,
    Finished: MATCH_STATUS.FINISHED,
    "Cancl.": MATCH_STATUS.CANCELLED,
    Cancl: MATCH_STATUS.CANCELLED,
    "Postp.": MATCH_STATUS.POSTPONED,
    "Aban.": MATCH_STATUS.ABANDONED,
} as const satisfies Record<string, MatchStatusCode>;

export type SportmonksStatusString = keyof typeof SPORTMONKS_STATUS_MAP;

export const DOCUMENTED_SPORTMONKS_STATUSES: readonly SportmonksStatusString[] =
    Object.keys(SPORTMONKS_STATUS_MAP) as SportmonksStatusString[];

export class UnknownSportmonksStatusError extends Error {
    constructor(public readonly sportmonksStatus: string) {
        super(
            `Unknown Sportmonks cricket status ${JSON.stringify(sportmonksStatus)}; refusing to sign`
        );
        this.name = "UnknownSportmonksStatusError";
    }
}

export class UnknownDrawNoResultError extends Error {
    constructor(public readonly drawNoResult: unknown) {
        super(
            `Unrecognized Sportmonks draw_noresult ${JSON.stringify(drawNoResult)}; refusing to sign`
        );
        this.name = "UnknownDrawNoResultError";
    }
}

export function mapSportmonksStatus(status: string): MatchStatusCode {
    if (Object.hasOwn(SPORTMONKS_STATUS_MAP, status)) {
        return SPORTMONKS_STATUS_MAP[status as SportmonksStatusString];
    }

    throw new UnknownSportmonksStatusError(status);
}

export function matchStatusLabel(code: number): string {
    return MATCH_STATUS_LABEL[code as MatchStatusCode] ?? `Unknown (${code})`;
}

export function matchOutcomeLabel(code: number): string {
    return MATCH_OUTCOME_LABEL[code as MatchOutcomeCode] ?? `Unknown (${code})`;
}

/**
 * Derive the signed outcome integer and Field-friendly winner id.
 *
 * `winnerTeamID = 0` means “no team id”, not “match ongoing”.
 * `outcome = 0` means Sportmonks has not asserted a winner, draw, or
 * no-result. That includes not-started and in-progress matches, and it
 * also includes a Finished fixture whose result fields are still empty.
 */
export function deriveOutcome(input: {
    winnerTeamId: number | null | undefined;
    drawNoResult: string | boolean | null | undefined;
}): { winnerTeamID: number; outcome: MatchOutcomeCode } {
    const winnerTeamID = toWinnerTeamId(input.winnerTeamId);
    const drawToken = normalizeDrawNoResult(input.drawNoResult);

    if (winnerTeamID > 0 && drawToken !== null) {
        throw new UnknownDrawNoResultError(
            `winner_team_id=${winnerTeamID} with draw_noresult=${JSON.stringify(input.drawNoResult)}`
        );
    }

    if (winnerTeamID > 0) {
        return { winnerTeamID, outcome: MATCH_OUTCOME.WINNER };
    }

    if (drawToken === "draw") {
        return { winnerTeamID: 0, outcome: MATCH_OUTCOME.DRAW };
    }

    if (drawToken === "no-result") {
        return { winnerTeamID: 0, outcome: MATCH_OUTCOME.NO_RESULT };
    }

    return { winnerTeamID: 0, outcome: MATCH_OUTCOME.NONE };
}

function toWinnerTeamId(value: number | null | undefined): number {
    if (value === null || value === undefined) {
        return 0;
    }

    if (!Number.isInteger(value) || value < 0) {
        throw new UnknownDrawNoResultError(value);
    }

    return value;
}

function normalizeDrawNoResult(
    value: string | boolean | null | undefined
): "draw" | "no-result" | null {
    if (value === null || value === undefined || value === false) {
        return null;
    }

    if (typeof value === "boolean") {
        throw new UnknownDrawNoResultError(value);
    }

    const normalized = value.trim().toLowerCase().replace(/[_/]+/g, "-");
    if (normalized === "") {
        return null;
    }

    if (normalized === "draw" || normalized === "drawn" || normalized === "tie" || normalized === "tied") {
        return "draw";
    }

    if (
        normalized === "no-result" ||
        normalized === "noresult" ||
        normalized === "no result" ||
        normalized === "nr"
    ) {
        return "no-result";
    }

    throw new UnknownDrawNoResultError(value);
}
