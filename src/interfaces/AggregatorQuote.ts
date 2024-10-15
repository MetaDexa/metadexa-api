export enum TradeType {
	ExactInput,
	ExactOutput,
}

export enum AggregatorName {
	OneInch = '1inch',
	ZeroX = '0x',
	Odos = 'Odos',
}

export interface AggregatorQuote {
	to: string | undefined;
	data: string | undefined; // The transaction data
	value: string | undefined; // The value of the transaction
	estimatedGas: number; // The estimated gas for the transaction
	buyTokenAddress: string; // The address of the token being bought
	buyAmount: string; // The amount of tokens being bought
	sellTokenAddress: string; // The address of the token being sold
	sellAmount: string; // The amount of tokens being sold
	allowanceTarget: string; // The address of the allowance target
	from: string; // The sender address
	recipient: string | undefined; // The recipient address
	tradeType: TradeType; // The type of trade (ExactInput or ExactOutput)
	aggregatorName: AggregatorName; // The name of the aggregator
}
