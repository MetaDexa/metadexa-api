export interface OdosAssembleRequestParameters {
    userAddr: string; // Address of the user who requested the quote
    pathId: string; // ID of the Path returned from the sor/quote/{version} endpoint
    simulate?: boolean; // Simulate the transaction to make sure it can actually be executed. This increases the response time to receive transaction data. Defaults to False.
    receiver?: string; // Optionally, specify a different receiver address for the transaction output, default receiver is userAddr
}