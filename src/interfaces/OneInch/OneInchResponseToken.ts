export interface OneInchResponseToken {
	address: string;
	symbol: string;
	name: string;
	decimals: number;
	eip2612: boolean;
	isFoT: boolean;
	logoURI: string;
	domainVersion?: string;
	tags: string[];
}
