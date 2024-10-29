import axios from 'axios';
import qs from 'qs';
import { Ok, Err, Result } from 'ts-results';
import { OneInchQuoteResponse } from '../interfaces/OneInch/OneInchQuoteResponse';
import { QUOTE_REQUEST_TIMEOUT } from '../constants/constants';
import { RequestError } from '../interfaces/RequestError';
import { RequestQuote } from '../interfaces/RequestQuote';
import {
	AggregatorName,
	AggregatorQuote,
	TradeType,
} from '../interfaces/AggregatorQuote';
import {
	OneInchQuoteQueryParameters,
	OneInchSwapQueryParameters,
} from '../interfaces/OneInch/OneInchQueryParameters';

import { OneInchSwapResponse } from '../interfaces/OneInch/OneInchSwapResponse';
import { ONEINCH_AGGREGATOR_ADDRESS } from '../constants/addresses';
import logger from '../lib/logger';

require('axios-debug-log');

function createQuoteQueryStringRequestObject(
	request: RequestQuote,
): OneInchQuoteQueryParameters {
	const queryString = {
		chain: request.chainId,
		src: request.sellTokenAddress,
		dst: request.buyTokenAddress,
		amount: request.sellTokenAmount ? request.sellTokenAmount : null,
		// protocols: '1inch',
		// fee = 3 // Partner fee. min: 0; max: 3 Should be the same for /quote and /swap
		// gasPrice: ,
		// complexityLevel: 1,
		// parts: 1,
		// mainRouteParts: 1,
		// gasLimit?: 10000000;
		includeTokensInfo: true, // Return fromToken and toToken info in response
		includeProtocols: true, // Return used swap protocols in response
		includeGas: true, // Return approximated gas in response
		// connectorTokens?: string;
		// excludedProtocols?: string;
	} as OneInchQuoteQueryParameters;
	return queryString;
}
function createSwapQueryStringRequestObject(
	request: RequestQuote,
): OneInchSwapQueryParameters {
	const queryString: OneInchSwapQueryParameters = {
		chain: request.chainId.toString(),
		src: request.sellTokenAddress,
		dst: request.buyTokenAddress,
		amount: request.sellTokenAmount ? request.sellTokenAmount : null,
		slippage: parseFloat(request.slippage),
		origin: request.fromAddress,
		from: request.fromAddress,
		disableEstimate: true,
		includeTokensInfo: true, // Return fromToken and toToken info in response
		includeProtocols: true, // Return used swap protocols in response
		includeGas: true, // Return approximated gas in response
		// connectorTokens?: string;
		// permit: request,
		// usePermit2: boolean;
	};
	return queryString;
}

function normalizeOneInchSwapResponse(
	response: OneInchSwapResponse,
	from: string,
	recipient: string,
	chainId: number | string,
	sellAmount: string,
): AggregatorQuote {
	try {
		const normalizedResponse: AggregatorQuote = {
			to: response.tx.to,
			data: response.tx.data,
			value: response.tx.value,
			estimatedGas: response.tx.gas,
			buyTokenAddress: response.dstToken.address,
			buyAmount: response.dstAmount,
			sellTokenAddress: response.srcToken.address,
			sellAmount,
			allowanceTarget: ONEINCH_AGGREGATOR_ADDRESS[chainId],
			from,
			recipient,
			tradeType: TradeType.ExactInput,
			aggregatorName: AggregatorName.OneInch,
		};
		return normalizedResponse;
	} catch (e) {
		logger.error(e);
		return undefined;
	}
}

function normalizeOneInchQuoteResponse(
	response: OneInchQuoteResponse,
	from: string,
	sellAmount: string,
	recipient: string,
	chainId: string | number,
): AggregatorQuote {
	try {
		const normalizedResponse: AggregatorQuote = {
			to: recipient,
			data: undefined,
			value: undefined,
			estimatedGas: response.gas,
			buyTokenAddress: response.dstToken.address,
			buyAmount: response.dstAmount,
			sellTokenAddress: response.srcToken.address,
			sellAmount,
			allowanceTarget: ONEINCH_AGGREGATOR_ADDRESS[chainId],
			from,
			recipient,
			tradeType: TradeType.ExactInput,
			aggregatorName: AggregatorName.OneInch,
		};
		return normalizedResponse;
	} catch (e) {
		logger.error('normalizeOneInchQuoteResponse', e);
		return undefined;
	}
}
export async function getOneInchQuoteApi(
	request: RequestQuote,
): Promise<Result<AggregatorQuote, RequestError>> {
	const { fromAddress, recipient, chainId, sellTokenAmount } = request;
	const queryString: OneInchQuoteQueryParameters =
		createQuoteQueryStringRequestObject(
			request,
		) as OneInchQuoteQueryParameters;
	const oneInchRequestHeader = {
		headers: {
			Authorization: `Bearer ${process.env.ONEINCH_API_KEY}`,
		},
	};

	try {
		const instance = axios.create();
		instance.defaults.timeout = QUOTE_REQUEST_TIMEOUT;
		// logger.debug('1inch quote queryString', queryString);
		const r = await instance.get(
			`https://api.1inch.dev/swap/v6.0/${chainId}/quote?${qs.stringify(
				queryString,
			)}`,
			oneInchRequestHeader,
		);

		const quoteData: OneInchQuoteResponse = r.data;

		// logger.debug('OneInch quote response', r.data);

		const normalizedResponse: AggregatorQuote =
			normalizeOneInchQuoteResponse(
				quoteData,
				fromAddress,
				sellTokenAmount,
				recipient,
				chainId,
			);

		// logger.debug('normalizedResponse', normalizedResponse);
		return new Ok(normalizedResponse);
	} catch (exception) {
		logger.error(
			`OneInch exception - status code: ${exception?.response?.status} ${exception?.response?.data?.description}`,
		);
		return new Err({
			statusCode: exception?.response?.status,
			data: exception?.response?.data?.description,
		});
	}
}

export async function getOneInchSwapApi(
	request: RequestQuote,
): Promise<Result<AggregatorQuote, RequestError>> {
	const { fromAddress, recipient, chainId, sellTokenAmount } = request;
	const queryString: OneInchSwapQueryParameters =
		createSwapQueryStringRequestObject(
			request,
		) as OneInchSwapQueryParameters;
	logger.debug('1inch swap queryString', queryString);

	const oneInchRequestHeader = {
		headers: {
			Authorization: `Bearer ${process.env.ONEINCH_API_KEY}`,
		},
	};

	try {
		const instance = axios.create();
		instance.defaults.timeout = QUOTE_REQUEST_TIMEOUT;
		const r = await instance.get(
			`https://api.1inch.dev/swap/v6.0/${chainId}/swap?${qs.stringify(
				queryString,
			)}`,
			oneInchRequestHeader,
		);

		// logger.debug(`OneInch swap response ${JSON.stringify(r.data)}`);

		const normalizedResponse: AggregatorQuote =
			normalizeOneInchSwapResponse(
				r.data,
				fromAddress,
				recipient ?? fromAddress,
				chainId,
				sellTokenAmount,
			);
		// logger.debug('normalizedResponse', normalizedResponse);
		return new Ok(normalizedResponse);
	} catch (exception) {
		logger.error(
			`OneInch exception - status code: ${exception?.response?.status} ${exception?.response?.data?.description} `,
		);
		return new Err({
			statusCode: exception?.response?.status,
			data: exception?.response?.data?.description,
		});
	}
}

export default async function getOneInchAggregatorQuote(
	request: RequestQuote,
): Promise<Result<AggregatorQuote, RequestError>> {
	if (request.sellTokenAmount === undefined)
		return new Err({
			statusCode: 404,
			data: 'Not supported method',
		});

	if (request.skipValidation) {
		return getOneInchQuoteApi(request);
	}
	return getOneInchSwapApi(request);
}
