export interface ZeroXQuoteResponse {
	blockNumber: string;
	buyToken: string;
	buyAmount: string;
	fees: {
		integratorFee: null | number;
		zeroExFee: {
			amount: string;
			token: string;
			type: 'volume';
		};
		gasFee: null | number;
	};
	issues: {
		allowance: null | number;
		balance: null | { token: string; actual: string; expected: string };
		simulationIncomplete: boolean;
		invalidSourcesPassed: string[];
	};
	liquidityAvailable: boolean;
	minBuyAmount: string;
	permit2: null | { type: string; hash: string; eip712: any };
	route: { fills: any[]; tokens: any[] };
	sellAmount: string;
	sellToken: string;
	tokenMetadata: {
		buyToken: { buyTaxBps: string; sellTaxBps: string };
		sellToken: { buyTaxBps: string; sellTaxBps: string };
	};
	totalNetworkFee: string;
	transaction?: {
		to: string;
		data: string;
		gas: string;
		gasPrice: string;
		value: string;
	}; // Not returned if /price
	gas?: string; // Not returned if /quote
	zid: string;
}
