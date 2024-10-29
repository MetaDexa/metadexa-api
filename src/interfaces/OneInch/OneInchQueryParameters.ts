export interface OneInchQuoteQueryParameters {
	chain: number;
	src: string;
	dst: string;
	amount: string;
	protocols?: string; // All supported liquidity sources by default
	fee?: number; // Partner fee. min: 0; max: 3 Should be the same for /quote and /swap
	gasPrice?: string; // Network price per gas in wei. By default fast network gas price
	complexityLevel?: number;
	parts?: number;
	mainRouteParts?: number;
	gasLimit?: number;
	includeTokensInfo?: boolean; // Return fromToken and toToken info in response
	includeProtocols?: boolean; // Return used swap protocols in response
	includeGas?: boolean; // Return approximated gas in response
	connectorTokens?: string;
	excludedProtocols?: string; // excluded supported liquidity sources
}

export interface OneInchSwapQueryParameters {
	chain: string;
	src: string;
	dst: string;
	amount: string;
	from: string;
	origin: string;
	slippage: number;
	protocols?: string; // All supported liquidity sources by default
	fee?: number;
	gasPrice?: number;
	complexityLevel?: number;
	parts?: number;
	mainRouteParts?: number;
	gasLimit?: number;
	includeTokensInfo?: boolean; // Return fromToken and toToken info in response
	includeProtocols?: boolean; // Return used swap protocols in response
	includeGas: boolean; // Return approximated gas in response
	connectorsTokens?: string;
	excludedProtocols?: string; // excluded supported liquidity sources
	permit?: string;
	receiver?: string;
	referrer?: string;
	allowPartialFill?: boolean;
	disableEstimate?: boolean;
	usePermit2?: boolean;
}
