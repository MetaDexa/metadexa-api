interface TransactionData {
    chainId: number; // The chain ID for the path to execute on
    gas: number; // Suggested gas limit. Either 2X the naive gas estimate or 10% more than the simulated gas estimate
    gasPrice: number; // Gas price used to calculate the path
    value: number; // Input amount of gas token. 0 if the gas token is not one of the inputs
    to: string; // Odos router address to be used for the transaction
    from: string; // Source of the executed transaction
    data: string; // Transaction data
    nonce: number; // Nonce value for the transaction
}

interface SimulationResults {
    isSuccess: boolean; // Indicates if the transaction reverted or not
    amountsOut: number[]; // Amounts out when the path was simulated
    simGasUsed: number; // Gas used by the simulation
    gasEstimate: number; // Estimate from an eth_estimateGas RPC call for the path
    simulationError?: string; // If a simulation error occurs, it will show up here
}


export interface OdosAssembleResponse {
    deprecated?: string; // If the endpoint or any part of the request is deprecated, this field will be populated with a message. This field is omitted if there is nothing to notify on.
    blockNumber: number; // Block number the quote was generated for
    gasEstimate: number; // A very naive gas estimate
    gasEstimateValue: number; // USD Value of the gasEstimate
    inputTokens: { address: string; amount: number }[]; // List of input token addresses and amounts
    outputTokens: { address: string; amount: number }[]; // List of output token addresses and amounts
    netOutValue: number; // USD value of the sum of the output tokens after gas
    outValues: number[]; // A list of the output values of the given output tokens. In the same order as the outputTokens list
    transaction: TransactionData; // Transaction data needed for execution
    simulation: SimulationResults; // Simulation results
}