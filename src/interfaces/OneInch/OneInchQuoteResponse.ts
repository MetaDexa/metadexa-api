import { OneInchResponseToken } from './OneInchResponseToken';

export interface OneInchQuoteResponse {
	srcToken: OneInchResponseToken;
	dstToken: OneInchResponseToken;
	dstAmount: string;
	gas: number;
	protocols: {
		name: string;
		part: number;
		fromTokenAddress: string;
		toTokenAddress: string;
		gas: number;
	}[][];
}
