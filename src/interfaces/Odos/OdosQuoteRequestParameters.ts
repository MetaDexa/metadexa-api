export interface OdosQuoteRequestParameters {
    chainId: number;
    inputTokens: {
        tokenAddress: string;
        amount: string;
    }[];
    outputTokens: {
        tokenAddress: string;
        proportion: number;
    }[];
    gasPrice?: number;
    userAddr?: string;
    slippageLimitPercent?: number;
    sourceBlacklist?: string[];
    sourceWhitelist?: string[];
    poolBlacklist?: string[];
    pathVizImage?: boolean;
    pathVizImageConfig?: {
        linkColors?: string[];
        nodeColor?: string;
        nodeTextColor?: string;
        legendTextColor?: string;
        width?: number;
        height?: number;
    };
    disableRFQs?: boolean;
    referralCode?: string;
    compact?: boolean;
    likeAsset?: boolean;
    simple?: boolean;
}