export const MATCH_STATUS = {
    NOT_STARTED: 1,
    IN_PROGRESS: 2,
    FINISHED: 3,
    CANCELLED: 4,
} as const;

/**
 * Converts Sportmonks text statuses into compact integers that are easy to
 * verify in circuits and other typed consumers.
 */
export function mapSportmonksStatus(status: string): number {
    switch (status) {
        case "NS":
            return MATCH_STATUS.NOT_STARTED;
        case "1st Innings":
        case "Innings Break":
        case "2nd Innings":
        case "Int.":
            return MATCH_STATUS.IN_PROGRESS;
        case "Finished":
            return MATCH_STATUS.FINISHED;
        default:
            return MATCH_STATUS.CANCELLED;
    }
}
