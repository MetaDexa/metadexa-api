import Web3 from 'web3';
import { Err, Ok, Result } from 'ts-results';
import BigNumber from 'bignumber.js';
import { createPublicClient, http } from 'viem';
import { ethers } from 'ethers/lib';
import { GAS_MARGIN, SUPPORTED_CHAINS } from '../constants/constants';
import { ResultQuote } from '../interfaces/ResultQuote';
import { AggregatorQuote, TradeType } from '../interfaces/AggregatorQuote';
import { CompositeQuote } from '../interfaces/CompositeQuote';
import { TransactionData } from '../interfaces/ResultGaslessQuote';
import {
	ALCHEMY_PROVIDER_URL,
	ANKR_PROVIDER_URL,
	FORWARDER_ADDRESS,
	INFURA_PROVIDER_URL,
	METASWAP_ROUTER_CONTRACT_ADDRESS,
	MULTICALL_ADDRESS,
	PROVIDER_ADDRESS,
} from '../constants/addresses';
import { ForwarderRequest } from '../interfaces/ForwarderRequest';
import validatorSign from './RelayerSignature';
import { RequestError } from '../interfaces/RequestError';

async function etherFallbackProvider(chainId: number) {
	const providers = [
		{
			provider: new ethers.providers.JsonRpcProvider(
				INFURA_PROVIDER_URL[chainId],
			),
			weight: 3,
			priority: 3,
		},
		{
			provider: new ethers.providers.JsonRpcProvider(
				ALCHEMY_PROVIDER_URL[chainId],
			),
			weight: 2,
			priority: 2,
		},
		{
			provider: new ethers.providers.JsonRpcProvider(
				ANKR_PROVIDER_URL[chainId],
			),
			weight: 1,
			priority: 1,
		},
	];

	return new ethers.providers.FallbackProvider(providers, 1);
}

export async function estimateGas(
	chainId: number,
	from: string,
	value: string,
	to: string,
	data: string,
): Promise<Result<number, RequestError>> {
	const ethersProvider = await etherFallbackProvider(chainId);
	const latestBlockNumber = await ethersProvider.getBlockNumber();
	const block = await ethersProvider.getBlock(latestBlockNumber);

	try {
		const gas = await ethersProvider.estimateGas({
			from,
			to,
			data,
			value,
			gasLimit: block.gasLimit,
		});
		return new Ok(Number(gas.toString()));
	} catch (error) {
		return new Err({
			statusCode: 500,
			data: `Utils.ts: Gas estimation failed: ${error}`,
		});
	}
}

async function estimateGasMechanism(
	chainId: number,
	from: string,
	value: string,
	to: string,
	data: string,
) {
	try {
		const publicClient = createPublicClient({
			chain: SUPPORTED_CHAINS[chainId],
			transport: http(PROVIDER_ADDRESS[chainId]),
		});
		const gas = await publicClient.estimateGas({
			from,
			to,
			data,
			value,
		});
		console.log('viem gas: ', gas);
		return new Ok(Number(gas.toString()));
	} catch (exception) {
		console.error('exception estimateGasMechanism: ', exception);

		const ethersEstimatedGas = await estimateGas(
			chainId,
			from,
			value,
			to,
			data,
		);

		if (ethersEstimatedGas.err) {
			return new Err({
				statusCode: 500,
				data: `Utils.ts: Gas estimation failed: ${exception}`,
			});
		}
		return ethersEstimatedGas;
	}
}

async function encodeDataForForwarderRequest(
	forwardRequest: ForwarderRequest,
	validatorSignature: string,
) {
	const forwarderInterface = new ethers.utils.Interface([
		{
			inputs: [
				{
					components: [
						{
							internalType: 'address',
							name: 'validator',
							type: 'address',
						},
						{
							internalType: 'address',
							name: 'targetAddress',
							type: 'address',
						},
						{
							internalType: 'bytes',
							name: 'data',
							type: 'bytes',
						},
						{
							internalType: 'address',
							name: 'paymentToken',
							type: 'address',
						},
						{
							internalType: 'uint256',
							name: 'paymentFees',
							type: 'uint256',
						},
						{
							internalType: 'uint256',
							name: 'tokenGasPrice',
							type: 'uint256',
						},
						{
							internalType: 'uint256',
							name: 'validTo',
							type: 'uint256',
						},
						{
							internalType: 'uint256',
							name: 'nonce',
							type: 'uint256',
						},
					],
					internalType: 'struct IForwarder.ForwardRequest',
					name: 'request',
					type: 'tuple',
				},
				{
					internalType: 'bytes',
					name: 'validatorSignature',
					type: 'bytes',
				},
			],
			name: 'executeCall',
			outputs: [],
			stateMutability: 'payable',
			type: 'function',
		},
	]);

	const encodedForwarderData2 = forwarderInterface.encodeFunctionData(
		'executeCall',
		[
			[
				forwardRequest.signer,
				forwardRequest.metaswap,
				forwardRequest.calldata,
				forwardRequest.paymentToken,
				forwardRequest.paymentFees,
				forwardRequest.tokenGasPrice,
				forwardRequest.validTo,
				forwardRequest.nonce,
			],
			validatorSignature,
		],
	);

	return encodedForwarderData2;
}

export async function getTransactionData(
	forwardRequest: ForwarderRequest,
	validatorSignature: string,
	from: string,
	gasPrice: string,
	chainId: number,
): Promise<Result<TransactionData, RequestError>> {
	try {
		const encodedForwarderData = await encodeDataForForwarderRequest(
			forwardRequest,
			validatorSignature,
		);
		const estimatedGas = await estimateGasMechanism(
			chainId,
			from,
			'0',
			FORWARDER_ADDRESS[chainId],
			encodedForwarderData,
		);
		if (estimatedGas.err) {
			return estimatedGas;
		}
		const gas = estimatedGas.unwrap();

		// build transaction object
		const result: TransactionData = {
			from,
			to: FORWARDER_ADDRESS[chainId],
			data: encodedForwarderData,
			gas,
			value: '0',
			gasPrice,
		};

		return new Ok(result);
	} catch (error) {
		return new Err({
			statusCode: 400,
			data: `Error building calldata: ${error}`,
		});
	}
}
function divCeilEthers(
	a: ethers.BigNumber,
	b: ethers.BigNumber,
): ethers.BigNumber {
	const div = a.div(b);
	const mod = a.mod(b);

	// Fast case - exact division
	if (mod.isZero()) return div;

	// Round up (for positive) or down (for negative)
	// Check if the result would be negative
	// In ethers.js, we need to check if either a or b is negative (but not both)
	// since division of negative by positive or positive by negative gives negative
	const isNegativeResult = a.isNegative() !== b.isNegative();
	return isNegativeResult ? div.sub(1) : div.add(1);
}

export function divCeil(divider, divisor) {
	const dm = divider.divmod(divisor);

	// Fast case - exact division
	if (dm.mod.isZero()) return dm.div;

	// Round up
	return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
}

function getBasicSellAmount(
	tokenTo: string,
	tokenFrom: string,
	paymentToken: string,
	betterRoute: AggregatorQuote,
	paymentFees: string,
) {
	const basicSellAmount2 =
		paymentToken === tokenFrom
			? ethers.BigNumber.from(betterRoute.sellAmount).sub(
					ethers.BigNumber.from(paymentFees),
			  )
			: ethers.BigNumber.from(betterRoute.sellAmount);

	return basicSellAmount2;
}

function getBasicBuyAmount(
	tokenTo: string,
	tokenFrom: string,
	paymentToken: string,
	betterRoute: AggregatorQuote,
	paymentFees: string,
) {
	const basicBuyAmount2 =
		paymentToken === tokenTo
			? ethers.BigNumber.from(betterRoute.buyAmount).sub(
					ethers.BigNumber.from(paymentFees),
			  )
			: ethers.BigNumber.from(betterRoute.buyAmount);

	return basicBuyAmount2;
}

function calculateAmountFrom(
	betterRoute: AggregatorQuote,
	basicSellAmount: any,
	slippage: string,
) {

	// Ethers.js version (refined)
	const amountFrom2 =
		betterRoute.tradeType === TradeType.ExactInput
			? ethers.utils.hexStripZeros(ethers.utils.hexlify(basicSellAmount))
			: ethers.utils.hexStripZeros(
					ethers.utils.hexlify(
						divCeilEthers(
							ethers.BigNumber.from(basicSellAmount).mul(
								ethers.BigNumber.from(100000).add(
									ethers.BigNumber.from(
										ethers.BigNumber.from(slippage)
											.mul(100000)
											.toString(),
										// new BigNumber(slippage)
										// 	.multipliedBy(100000)
										// 	.toString(),
									),
								),
							),
							ethers.BigNumber.from(100000),
						),
					),
			  );

	return amountFrom2;
}

// todo: check this function many times, the output is not always the same
function calculateMinAmount(
	betterRoute: AggregatorQuote,
	basicBuyAmount: any,
	slippage: string,
) {
	const basicBuyAmount2 = ethers.BigNumber.from(basicBuyAmount.toString());
	// Ethers.js equivalent
	const minAmount2 =
		betterRoute.tradeType === TradeType.ExactInput
			? `0x${divCeilEthers(
					basicBuyAmount2.mul(
						ethers.BigNumber.from(100000).sub(
							ethers.BigNumber.from(
								new BigNumber(slippage)
									.multipliedBy(100000)
									.toString(),
							),
						),
					),
					ethers.BigNumber.from(100000),
			  )
					.toHexString()
					.substring(2)}`
			: `0x${basicBuyAmount2.toHexString().substring(2)}`;

	// console.log('minAmount', minAmount);
	// console.log('minAmount2', minAmount2);
	// console.log('are they the same: ', minAmount === minAmount2);

	return minAmount2;
}

/**
 * Encodes adapter data for gasless swaps
 * @param tokenFrom Source token address
 * @param tokenTo Destination token address
 * @param amountFrom Amount of source token
 * @param minAmount Minimum amount of destination token
 * @param paymentToken Token used for payment
 * @param paymentFees Payment fees
 * @param signer Signer address
 * @param aggregator Aggregator address
 * @param aggregatorData Aggregator data
 * @returns Encoded adapter data
 */
function encodeAdapterData( // todo: check this method later, this is where it had problems
	tokenFrom: string,
	tokenTo: string,
	amountFrom: any,
	minAmount: string,
	paymentToken: string,
	paymentFees: string,
	signer: string,
	aggregator: string,
	aggregatorData: string,
): string {
	const web3 = new Web3();

	// Web3.js implementation
	const adapterDataWeb3 = web3.eth.abi.encodeParameter(
		'tuple(address,address,uint256,uint256,address,uint256,address,address,bytes)',
		[
			tokenFrom,
			tokenTo,
			amountFrom,
			minAmount,
			paymentToken,
			paymentFees,
			signer,
			aggregator,
			aggregatorData,
		],
	);
	// Ethers.js implementation
	const abiCoder = new ethers.utils.AbiCoder();
	const amountFromEthers = ethers.BigNumber.from(amountFrom.toString());

	// Encode the parameters into a tuple
	const adapterDataEthers = abiCoder.encode(
		[
			'(address,address,uint256,uint256,address,uint256,address,address,bytes)',
		],
		[
			[
				tokenFrom,
				tokenTo,
				amountFromEthers,
				minAmount,
				paymentToken,
				paymentFees,
				signer,
				aggregator,
				aggregatorData,
			],
		],
	);

	return adapterDataEthers;
}

/**
 * Encodes function call data for the swap function
 * @param tokenFrom Source token address
 * @param amountFrom Amount of source token
 * @param recipient Recipient address
 * @param adapterId Adapter ID
 * @param adapterData Adapter data
 * @returns Encoded function call data
 */
function encodeSwapFunctionCall(
	tokenFrom: string,
	amountFrom: any,
	recipient: string | undefined,
	adapterId: string,
	adapterData: string,
): string {
	// Ethers.js implementation
	const swapInterface = new ethers.utils.Interface([
		'function swap(address tokenFrom, uint256 amount, address recipient, tuple(string adapterId, bytes data) adapterInfo)',
	]);

	const amountFromEthers = ethers.BigNumber.from(amountFrom.toString());
	const recipientAddress =
		recipient || '0x0000000000000000000000000000000000000001';

	const encodedDataEthers = swapInterface.encodeFunctionData('swap', [
		tokenFrom,
		amountFromEthers,
		recipientAddress,
		[adapterId, adapterData],
	]);

	// Return the Web3.js implementation for now
	return encodedDataEthers;
}

export function buildGaslessAggregatorCallData(
	betterRoute: AggregatorQuote,
	slippage: string,
	paymentToken: string,
	paymentFees: string,
	signer: string,
	chainId: number,
): Result<string, RequestError> {
	try {
		const tokenFrom = betterRoute.sellTokenAddress;
		const tokenTo = betterRoute.buyTokenAddress;

		const basicSellAmount = getBasicSellAmount(
			tokenTo,
			tokenFrom,
			paymentToken,
			betterRoute,
			paymentFees,
		);

		if (basicSellAmount.isNegative()) {
			return new Err({
				statusCode: 400,
				data: 'Insufficient sell amount',
			});
		}

		const basicBuyAmount = getBasicBuyAmount(
			tokenTo,
			tokenFrom,
			paymentToken,
			betterRoute,
			paymentFees,
		);

		if (basicBuyAmount.isNegative()) {
			return new Err({
				statusCode: 400,
				data: 'Insuficient buy amount',
			});
		}

		const amountFrom = calculateAmountFrom(
			betterRoute,
			basicSellAmount,
			slippage,
		);

		const minAmount = calculateMinAmount(
			betterRoute,
			basicBuyAmount,
			slippage,
		);

		const aggregator = betterRoute.to;

		const aggregatorData = betterRoute.data;
		let adapterId;

		if (chainId === 137) adapterId = 'GaslessSwap';
		else if (chainId === 1) adapterId = 'gaslessSwapAdapter';
		else adapterId = 'GaslessSwapAdapter';

		const adapterData = encodeAdapterData(
			tokenFrom,
			tokenTo,
			amountFrom,
			minAmount,
			paymentToken,
			paymentFees,
			signer,
			aggregator,
			aggregatorData,
		);

		const encodedData = encodeSwapFunctionCall(
			tokenFrom,
			amountFrom,
			betterRoute.recipient,
			adapterId,
			adapterData,
		);
		return new Ok(encodedData);
	} catch (error) {
		return new Err({
			statusCode: 400,
			data: `Error: ${error}`,
		});
	}
}

function paymetTokenBalanceDataEncodedFunctionCall(chainId: number) {
	// Create an Interface instance with the ABI
	const paymentTokenInterface = new ethers.utils.Interface([
		{
			inputs: [
				{
					internalType: 'address',
					name: 'account',
					type: 'address',
				},
			],
			name: 'balanceOf',
			outputs: [
				{
					internalType: 'uint256',
					name: '',
					type: 'uint256',
				},
			],
			stateMutability: 'view',
			type: 'function',
		},
	]);

	// Encode the function call
	const paymentTokenBalanceData2 = paymentTokenInterface.encodeFunctionData(
		'balanceOf',
		[MULTICALL_ADDRESS[chainId]],
	);

	return paymentTokenBalanceData2;
}

function ethBalanceDataEncodedFunctionCall(chainId: number) {
	// New Ethers.js implementation
	const ethBalanceInterface = new ethers.utils.Interface([
		{
			inputs: [
				{
					internalType: 'address',
					name: 'addr',
					type: 'address',
				},
			],
			name: 'getEthBalance',
			outputs: [
				{
					internalType: 'uint256',
					name: 'balance',
					type: 'uint256',
				},
			],
			stateMutability: 'view',
			type: 'function',
		},
	]);

	const ethBalanceData2 = ethBalanceInterface.encodeFunctionData(
		'getEthBalance',
		[MULTICALL_ADDRESS[chainId]],
	);

	return ethBalanceData2;
}

// TODO: THIS METHOD REMAINS TO BE IMPLEMENTED;
export default async function simulateTransaction(
	chainId: number,
	slippage: string,
	resultQuote: ResultQuote,
	aggregatorQuote: AggregatorQuote,
	paymentTokenAddress: string,
	paymentFees: string,
	outputQuote: CompositeQuote,
	tx: TransactionData,
	signer: string,
	gasFees: string,
): Promise<Result<string, RequestError>> {
	const calldatas = [];
	// 1.find payment token balance
	// 2. find eth balance
	// 3. Execute tx

	try {
		const paymentTokenBalanceData =
			paymetTokenBalanceDataEncodedFunctionCall(chainId);

		const ethBalanceData = ethBalanceDataEncodedFunctionCall(chainId);

		// this is rewritten to ethers
		const customSimulatorData = buildGaslessAggregatorCallData(
			aggregatorQuote,
			slippage,
			paymentTokenAddress,
			paymentFees,
			MULTICALL_ADDRESS[chainId],
			chainId,
		);

		// build and sign forwarder request
		const minutesToAdd = 10;
		const nonce = new Date().getTime();
		const validTo = new Date(nonce + minutesToAdd * 60000).getTime();
		const calldata = customSimulatorData.unwrap();

		const forwarderRequest: ForwarderRequest = {
			signer,
			metaswap: METASWAP_ROUTER_CONTRACT_ADDRESS[chainId],
			calldata,
			paymentToken: paymentTokenAddress,
			paymentFees,
			tokenGasPrice: '0',
			validTo,
			nonce,
		};

		// TODO: REPLACE THIS WITH ETHERS INSTEAD OF VIEM
		const validatorSignature = await validatorSign(
			forwarderRequest,
			chainId,
			tx.from,
			FORWARDER_ADDRESS[chainId],
		);
		// build txn data
		const txData = await getTransactionData(
			forwarderRequest,
			validatorSignature.unwrap(),
			tx.from,
			resultQuote.tx.gasPrice,
			chainId,
		);

		// BUILD THE CALLDATA
		calldatas.push([MULTICALL_ADDRESS[chainId], 100000, ethBalanceData]);
		// user swap
		calldatas.push([
			txData.unwrap().to,
			txData.unwrap().gas * 2,
			txData.unwrap().data,
		]);
		const isNonNativePaymentToken =
			paymentTokenAddress !==
				'0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' &&
			outputQuote.aggregatorQuote;
		if (isNonNativePaymentToken) {
			// New Ethers.js implementation
			const approvalTokenInterface = new ethers.utils.Interface([
				{
					inputs: [
						{
							internalType: 'address',
							name: 'token',
							type: 'address',
						},
						{
							internalType: 'uint256',
							name: 'amount',
							type: 'uint256',
						},
						{
							internalType: 'address',
							name: 'spender',
							type: 'address',
						},
					],
					name: 'approveToken',
					outputs: [],
					stateMutability: 'nonpayable',
					type: 'function',
				},
			]);

			const approvalTokenData = approvalTokenInterface.encodeFunctionData(
				'approveToken',
				[
					paymentTokenAddress,
					paymentFees,
					outputQuote?.aggregatorQuote?.to,
				],
			);

			calldatas.push([
				paymentTokenAddress,
				100000,
				paymentTokenBalanceData,
			]);
			calldatas.push([
				MULTICALL_ADDRESS[chainId],
				100000,
				approvalTokenData,
			]);

			// output swap
			calldatas.push([
				outputQuote.aggregatorQuote.to,
				outputQuote.aggregatorQuote.estimatedGas * 4,
				outputQuote.aggregatorQuote.data,
			]);
		}
		calldatas.push([MULTICALL_ADDRESS[chainId], 100000, ethBalanceData]);

		// 4.approve payment token fees to metaswap
		// 5. execute aggregator quote to swap payment token to eth
		// 6. find payment token balance
		// 7. find eth token balance

		// after call
		// 8. check if 6-1 is equal to payment fees
		// 9. check if 7-2 is equal to gas fees (with acceptable margin)

		// New Ethers.js implementation
		const multicallInterface = new ethers.utils.Interface([
			{
				inputs: [
					{
						components: [
							{
								internalType: 'address',
								name: 'target',
								type: 'address',
							},
							{
								internalType: 'uint256',
								name: 'gasLimit',
								type: 'uint256',
							},
							{
								internalType: 'bytes',
								name: 'callData',
								type: 'bytes',
							},
						],
						internalType: 'struct UniswapInterfaceMulticall.Call[]',
						name: 'calls',
						type: 'tuple[]',
					},
				],
				name: 'multicall',
				outputs: [
					{
						internalType: 'uint256',
						name: 'blockNumber',
						type: 'uint256',
					},
					{
						components: [
							{
								internalType: 'bool',
								name: 'success',
								type: 'bool',
							},
							{
								internalType: 'uint256',
								name: 'gasUsed',
								type: 'uint256',
							},
							{
								internalType: 'bytes',
								name: 'returnData',
								type: 'bytes',
							},
						],
						internalType:
							'struct UniswapInterfaceMulticall.Result[]',
						name: 'returnData',
						type: 'tuple[]',
					},
				],
				stateMutability: 'nonpayable',
				type: 'function',
			},
		]);

		const encodedData = multicallInterface.encodeFunctionData('multicall', [
			calldatas,
		]);

		const provider = new ethers.providers.JsonRpcProvider(
			PROVIDER_ADDRESS[chainId],
		);

		// Make the call using Ethers.js
		const result = await provider.call({
			from: tx.from,
			to: MULTICALL_ADDRESS[chainId],
			data: encodedData,
		});

		// New Ethers.js implementation
		// First, create the Interface with the same ABI (you might already have this from encoding)
		const multicallInterface2 = new ethers.utils.Interface([
			{
				inputs: [], // We only need outputs for decoding, but Interface requires a full ABI
				name: 'multicall',
				outputs: [
					{
						internalType: 'uint256',
						name: 'blockNumber',
						type: 'uint256',
					},
					{
						components: [
							{
								internalType: 'bool',
								name: 'success',
								type: 'bool',
							},
							{
								internalType: 'uint256',
								name: 'gasUsed',
								type: 'uint256',
							},
							{
								internalType: 'bytes',
								name: 'returnData',
								type: 'bytes',
							},
						],
						internalType:
							'struct UniswapInterfaceMulticall.Result[]',
						name: 'returnData',
						type: 'tuple[]',
					},
				],
				stateMutability: 'nonpayable',
				type: 'function',
			},
		]);

		// Decode the result using the Interface
		const decodedData2 = multicallInterface2.decodeFunctionResult(
			'multicall',
			result,
		);

		const resultData2 = decodedData2.returnData;

		const beforeEthBalance2 = resultData2[0]?.returnData;

		const afterEthBalance2 = isNonNativePaymentToken
			? resultData2[5]?.returnData
			: resultData2[2]?.returnData;

		const paymentFeeBalance2 = isNonNativePaymentToken
			? resultData2[2]?.returnData
			: paymentFees;

		const paymentFeeBalanceBN2 = ethers.BigNumber.from(paymentFeeBalance2);

		const ethBalanceDiff2 = ethers.BigNumber.from(afterEthBalance2).sub(
			ethers.BigNumber.from(beforeEthBalance2),
		);

		const paymentFeeValid2 = paymentFeeBalanceBN2.eq(
			ethers.BigNumber.from(paymentFees),
		);

		const ethBalanceValid2 = ethBalanceDiff2.gte(
			ethers.BigNumber.from(gasFees)
				.mul(ethers.BigNumber.from(GAS_MARGIN))
				.div(ethers.BigNumber.from(100)),
		);

		if (chainId !== 1 && !paymentFeeValid2) {
			throw new Error('Cannot accept the token as a relayer fee');
		}

		if (chainId !== 1 && !ethBalanceValid2) {
			throw new Error('Cannot swap the token for native currency');
		}

		return new Ok(result);
	} catch (exception) {
		return new Err({
			statusCode: 400,
			data: exception?.toString(),
		});
	}
}
