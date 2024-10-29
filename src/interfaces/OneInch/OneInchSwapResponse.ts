import { OneInchResponseToken } from './OneInchResponseToken';

export interface OneInchSwapResponse {
	srcToken: OneInchResponseToken;
	dstToken: OneInchResponseToken;
	estimatedGas: number | undefined;
	dstAmount: string;
	tx: {
		from: string;
		to: string;
		data: string;
		value: string;
		gas: number;
		gasPrice: number;
	};
}
