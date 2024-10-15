


export interface OdosQuoteResponse {
    deprecated?: string;
    pathId: string;
    blockNumber: number;
    gasEstimate: number;
    gasEstimateValue: number;
    dataGasEstimate?: string;
    gweiPerGas: number;
    inTokens: string[];
    inAmounts: string[];
    outTokens: string[];
    outAmounts: string[];
    netOutValue: number;
    outValues: number[];
    priceImpact: number;
    percentDiff: number;
    partnerFeePercent: number;
    pathVizImage: string;
}

