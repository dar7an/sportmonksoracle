/**
 * Minimal Mina SmartContract that verifies this oracle's v1.1 signatures
 * on-chain. Copy it into a zkApp and compile with o1js.
 *
 * Fixture fields:  [fixtureID, localTeamID, visitorTeamID, startingAt]
 * Status fields:   [fixtureID, localTeamID, visitorTeamID, startingAt, status, winnerTeamID, outcome]
 */
import {
    Field,
    method,
    PublicKey,
    Signature,
    SmartContract,
    State,
    state,
} from "o1js";

export class CricketOracleVerifier extends SmartContract {
    @state(PublicKey) oraclePublicKey = State<PublicKey>();

    @method async verifyFixture(
        fixtureID: Field,
        localTeamID: Field,
        visitorTeamID: Field,
        startingAt: Field,
        signature: Signature
    ) {
        const oraclePublicKey = this.oraclePublicKey.get();
        this.oraclePublicKey.requireEquals(oraclePublicKey);
        signature
            .verify(oraclePublicKey, [fixtureID, localTeamID, visitorTeamID, startingAt])
            .assertTrue();
    }

    @method async verifyStatus(
        fixtureID: Field,
        localTeamID: Field,
        visitorTeamID: Field,
        startingAt: Field,
        status: Field,
        winnerTeamID: Field,
        outcome: Field,
        signature: Signature
    ) {
        const oraclePublicKey = this.oraclePublicKey.get();
        this.oraclePublicKey.requireEquals(oraclePublicKey);
        signature
            .verify(oraclePublicKey, [
                fixtureID,
                localTeamID,
                visitorTeamID,
                startingAt,
                status,
                winnerTeamID,
                outcome,
            ])
            .assertTrue();
    }
}
