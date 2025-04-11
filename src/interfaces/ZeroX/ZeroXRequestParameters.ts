// See https://0x.org/docs/api#tag/Swap/operation/swap::permit2::getQuote
export interface ZeroXRequestParameters {
	chainId: number;
	buyToken: string;
	sellToken: string;
	sellAmount: string | null;
	taker: string;
	txOrigin: string | null; // The address of the wallet that initiated the transaction. This is used for gasless transactions or if taker is a smartcontract
	swapFeeRecipient: string | null; // Wallet address that should receive the affiliate fees
	swapFeeBps: number | null; // Percentage of buyAmount that should be attributed as affiliate fees
	swapFeeToken: string | null; // Receive trading fee in sellToken (DAI)
	excludedSources: string | null;
	gasPrice: string | null; // The target gas price (in wei) for the swap transaction. If not provided, the default value is based on the 0x gas price oracle
	slippageBps: number | null;
	sellEntireBalance: boolean; // If true, sell the entire balance of the sellToken
	tradeSurplusRecipient: string | null; // Address to receive any surplus from the swap
}
