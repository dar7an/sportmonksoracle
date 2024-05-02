process.env.PRIVATE_KEY = 'mock-private-key';
process.env.API_KEY = 'mock-api-key';

import { expect } from 'chai';

import { fetchFixtureStatus, signFixtureData } from '../app/status/[fixtureID]/route';

//Testing for not providing fixtureID
describe('fetchFixtureStatus function', () => {
    it('should fail when no fixtureID is provided', async () => {
        const result = await fetchFixtureStatus(undefined as unknown as number);
        expect(result).to.be.null;
    });
});

//Testing for invalid fixtureStatus
describe('signFixtureData function', () => {
    it('should fail when invalid fixtureStatus is provided', () => {
        // Create an invalid fixtureStatus object
        const fixtureStatus: any = {
            fixtureID: 'invalid',
            status: 'invalid',
            winnerTeamID: 'invalid',
        };

        const result = signFixtureData(fixtureStatus);
        expect(result).to.be.null;
    });
});
