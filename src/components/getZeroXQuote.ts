import axios from 'axios';
import qs from 'qs';
import { Ok, Err, Result } from 'ts-results';
import { QUOTE_REQUEST_TIMEOUT } from '../constants/constants';
import { ZeroXQuoteResponse } from '../interfaces/ZeroX/ZeroXQuoteResponse';
import {
	AggregatorName,
	AggregatorQuote,
	TradeType,
} from '../interfaces/AggregatorQuote';
import { ZeroXRequestParameters } from '../interfaces/ZeroX/ZeroXRequestParameters';
import { RequestError } from '../interfaces/RequestError';
import { RequestQuote } from '../interfaces/RequestQuote';
import logger from '../lib/logger';

function createQueryStringRequestObject(
	request: RequestQuote,
): ZeroXRequestParameters {
	return {
		sellToken: request.sellTokenAddress,
		buyToken: request.buyTokenAddress,
		slippagePercentage: request.slippage,
		feeRecipient:
			request.affiliate !== '' || request.affiliate !== undefined
				? request.affiliate
				: null,
		buyTokenPercentage:
			(request.affiliateFee !== '' ||
				request.affiliateFee !== undefined) &&
			request.affiliate
				? request.affiliateFee
				: null,
		skipValidation: true,
		sellAmount:
			request.sellTokenAmount !== '' &&
			request.sellTokenAmount !== undefined
				? request.sellTokenAmount
				: null,
		buyAmount:
			request.buyTokenAmount !== '' &&
			request.buyTokenAmount !== undefined
				? request.buyTokenAmount
				: null,
		takerAddress: request.fromAddress,
	};
}

function normalizeZeroXResponse(
	response: ZeroXQuoteResponse,
	isSellAmount: boolean,
	from: string,
	recipient: string,
): AggregatorQuote {
	return {
		to: response.to,
		data: response.data,
		value: response.value,
		estimatedGas: response.estimatedGas,
		buyTokenAddress: response.buyTokenAddress,
		buyAmount: response.buyAmount,
		sellTokenAddress: response.sellTokenAddress,
		sellAmount: response.sellAmount,
		allowanceTarget: response.allowanceTarget,
		from,
		recipient,
		tradeType: isSellAmount ? TradeType.ExactInput : TradeType.ExactOutput,
		aggregatorName: AggregatorName.ZeroX,
	};
}

export default async function getZeroXQuote(
	request: RequestQuote,
): Promise<Result<AggregatorQuote, RequestError>> {
	const { sellTokenAmount, fromAddress, recipient, chainId } = request;
	const queryString = createQueryStringRequestObject(request);
	const endpoints = {
		1: 'api.0x.org',
		137: 'polygon.api.0x.org',
		10: 'optimism.api.0x.org',
		42161: 'arbitrum.api.0x.org',
		8453: 'base.api.0x.org',
	};

	try {
		const instance = axios.create();
		instance.defaults.timeout = QUOTE_REQUEST_TIMEOUT;

		const config = {
			headers: {
				'0x-api-key': process.env.ZEROX_API_KEY,
			},
		};

		const r = await instance.get(
			`https://${endpoints[chainId]}/swap/v1/quote?${qs.stringify(
				queryString,
				{
					strictNullHandling: true,
					skipNulls: true,
				},
			)}`,
			config,
		);

		return new Ok(
			normalizeZeroXResponse(
				r.data,
				!!sellTokenAmount,
				fromAddress,
				recipient,
			),
		);
	} catch (exception) {
		logger.error(
			`ZeroX exception - status code: ${exception?.toString()} `,
			exception?.toString(),
		);
		return new Err({
			statusCode: exception?.response?.status,
			data: exception?.response?.data,
		});
	}
}
