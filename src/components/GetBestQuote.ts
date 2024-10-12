/** @format */

import Web3 from 'web3';
import { Ok, Err, Result } from 'ts-results';
import BigNumber from 'bignumber.js';
import { TransactionData } from '../interfaces/ResultQuote';
import { RequestError } from '../interfaces/RequestError';
import {
	METASWAP_ROUTER_CONTRACT_ADDRESS,
	PROVIDER_ADDRESS,
} from '../constants/addresses';
import getZeroXQuote from './getZeroXQuote';
import getOneInchQuote from './getOneInchQuote';
import compareRoutes from './compareRoutes';
import { AggregatorQuote, TradeType } from '../interfaces/AggregatorQuote';
import { RequestQuote } from '../interfaces/RequestQuote';
import { CompositeQuote } from '../interfaces/CompositeQuote';
import { divCeil } from './utils';
import getOdosQuote from './getOdosQuote';
import logger from '../lib/logger';

async function getGasPrice(chainId: number): Promise<Result<string, Error>> {
	const web3 = new Web3(Web3.givenProvider || PROVIDER_ADDRESS[chainId]);
	try {
		const gasPrice = await web3.eth.getGasPrice();
		return new Ok(gasPrice);
	} catch (error) {
		return new Err(new Error(`Gas price failed: ${error.message}`));
	}
}

async function estimateGas(
	from: string,
	to: string,
	value: string,
	chainId: number,
	data: string,
): Promise<Result<number, Error>> {
	const web3 = new Web3(Web3.givenProvider || PROVIDER_ADDRESS[chainId]);
	try {
		const estimate = await web3.eth.estimateGas({
			to,
			from,
			data,
			value,
		});

		return new Ok(estimate);
	} catch (error) {
		return new Err(new Error(`Gas estimation error: ${error.message}`));
	}
}

async function getRouterlessTransactionData(
	betterRoute: AggregatorQuote,
	slippage: string,
	chainId: number,
): Promise<Result<TransactionData, RequestError>> {
	const estimatedGas = await estimateGas(
		betterRoute.from,
		betterRoute.to,
		betterRoute.value,
		chainId,
		betterRoute.data,
	);
	const gasPrice = await getGasPrice(chainId);
	if (estimatedGas.err) {
		return new Err({
			statusCode: 500,
			data: `Transaction simulation failed: ${estimatedGas.val}`,
		});
	}
	const gas = estimatedGas.unwrap();
	const result: TransactionData = {
		from: betterRoute.from,
		to: betterRoute.to,
		data: betterRoute.data,
		gas,
		value: betterRoute.value,
		gasPrice: gasPrice.ok ? gasPrice.unwrap() : '0',
	};
	return new Ok(result);
}

async function getTransactionData(
	betterRoute: AggregatorQuote,
	slippage: string,
	chainId: number,
): Promise<Result<TransactionData, RequestError>> {
	const web3 = new Web3();

	const tokenFrom = betterRoute.sellTokenAddress;
	const tokenTo = betterRoute.buyTokenAddress;
	const amountFrom =
		betterRoute.tradeType === TradeType.ExactInput
			? web3.utils.toHex(betterRoute.sellAmount)
			: web3.utils.toHex(
					divCeil(
						web3.utils
							.toBN(betterRoute.sellAmount)
							.mul(
								web3.utils
									.toBN(100000)
									.add(
										web3.utils.toBN(
											new BigNumber(slippage)
												.multipliedBy(100000)
												.toString(),
										),
									),
							),
						web3.utils.toBN(100000),
					),
			  );

	const minAmount =
		betterRoute.tradeType === TradeType.ExactInput
			? web3.utils.toHex(
					divCeil(
						web3.utils
							.toBN(betterRoute.buyAmount)
							.mul(
								web3.utils
									.toBN(100000)
									.sub(
										web3.utils.toBN(
											new BigNumber(slippage)
												.multipliedBy(100000)
												.toString(),
										),
									),
							),
						web3.utils.toBN(100000),
					),
			  )
			: web3.utils.toHex(betterRoute.buyAmount);

	const aggregator = betterRoute.to;

	const aggregatorData = betterRoute.data;
	const adapterId = 'SwapAggregator';
	const adapterData: string = web3.eth.abi.encodeParameter(
		'tuple(address,address,uint256,uint256,address,bytes)',
		[tokenFrom, tokenTo, amountFrom, minAmount, aggregator, aggregatorData],
	);

	const encodedData = web3.eth.abi.encodeFunctionCall(
		{
			name: 'swap',
			type: 'function',
			inputs: [
				{
					internalType: 'contract IERC20',
					name: 'tokenFrom',
					type: 'address',
				},
				{
					internalType: 'uint256',
					name: 'amount',
					type: 'uint256',
				},
				{
					internalType: 'address payable',
					name: 'recipient',
					type: 'address',
				},
				{
					components: [
						{
							internalType: 'string',
							name: 'adapterId',
							type: 'string',
						},
						{
							internalType: 'bytes',
							name: 'data',
							type: 'bytes',
						},
					],
					internalType: 'struct MetaSwapRouter.AdapterInfo',
					name: 'adapterInfo',
					type: 'tuple',
				},
			],
		},
		[
			tokenFrom,
			Web3.utils.toHex(amountFrom),
			betterRoute.recipient
				? betterRoute.recipient
				: '0x0000000000000000000000000000000000000001',
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			[adapterId, adapterData],
		],
	);

	// TODO build multicall when permit is included
	// TODO; can be paralilized
	const estimatedGas = await estimateGas(
		betterRoute.from,
		METASWAP_ROUTER_CONTRACT_ADDRESS[chainId] ??
			betterRoute.allowanceTarget,
		betterRoute.value,
		chainId,
		encodedData,
	);

	const gasPrice = await getGasPrice(chainId);

	if (estimatedGas.err) {
		return new Err({
			statusCode: 500,
			data: `Transaction simulation failed: ${estimatedGas.val}`,
		});
	}
	const gas = estimatedGas.unwrap();

	// build transaction object
	const result: TransactionData = {
		from: betterRoute.from,
		to:
			METASWAP_ROUTER_CONTRACT_ADDRESS[chainId] ??
			betterRoute.allowanceTarget,
		data: encodedData,
		gas,
		value: betterRoute.value,
		gasPrice: gasPrice.ok ? gasPrice.unwrap() : '0',
	};

	return new Ok(result);
}

function getNormalizedResponse(
	betterRoute: AggregatorQuote,
	chainId: number,
	txData: TransactionData | undefined,
): CompositeQuote {
	return {
		resultQuote: {
			estimatedGas: betterRoute.estimatedGas,
			buyTokenAddress: betterRoute.buyTokenAddress,
			buyAmount: betterRoute.buyAmount,
			sellTokenAddress: betterRoute.sellTokenAddress,
			sellAmount: betterRoute.sellAmount,
			allowanceTarget:
				betterRoute.sellTokenAddress ===
				'0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
					? '0x0000000000000000000000000000000000000000'
					: METASWAP_ROUTER_CONTRACT_ADDRESS[chainId] ??
					  betterRoute.allowanceTarget,
			tx: txData,
		},
		aggregatorQuote: betterRoute,
	};
}

export default async function getBestQuote(
	request: RequestQuote,
): Promise<Result<CompositeQuote, RequestError>> {
	const [zeroXQuote, odosQuote] = await Promise.all([
		getZeroXQuote(request),
		getOdosQuote(request),
		getOneInchQuote(request, request.skipValidation),
	]);

	const aggregatorQuotes: Result<AggregatorQuote, RequestError>[] = [
		zeroXQuote,
		odosQuote,
		// oneInchQuote, // this one is not working for now anwyway
	];

	const validAggregatorQuotes = aggregatorQuotes.filter(
		(quote) => quote !== undefined && quote.ok && !quote.err,
	);

	// check if there are no valid aggregator quotes
	if (validAggregatorQuotes.length === 0) {
		return new Err({
			statusCode: 500,
			data: 'Aggregate Request failed',
		});
	}

	const betterRoute: Result<AggregatorQuote, RequestError> = compareRoutes(
		validAggregatorQuotes,
	);

	// check if better router is not errored
	// ??
	if (betterRoute.err) {
		return betterRoute;
	}

	let txData: TransactionData | undefined;

	logger.debug('betterRoute', betterRoute);

	if (!request.skipValidation) {
		// get transaction data
		let transactionData: Result<TransactionData, RequestError>;
		if (METASWAP_ROUTER_CONTRACT_ADDRESS[request.chainId]) {
			transactionData = await getTransactionData(
				betterRoute.unwrap(),
				request.slippage,
				request.chainId,
			);
		} else {
			transactionData = await getRouterlessTransactionData(
				betterRoute.unwrap(),
				request.slippage,
				request.chainId,
			);
		}
		// check if validation is success; return if not
		if (transactionData.err) {
			return transactionData;
		}
		txData = transactionData.unwrap();
	}

	return new Ok(
		getNormalizedResponse(betterRoute.unwrap(), request.chainId, txData),
	);
}
