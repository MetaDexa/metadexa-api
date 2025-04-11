import axios, { AxiosResponse } from 'axios';
import qs from 'qs';
import { Ok, Err, Result } from 'ts-results';
import { ZEROX_ALLOWANCE_HOLDER_CONTRACT } from '../constants/addresses';
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
	const parameters = {
		chainId: request.chainId,
		buyToken: request.buyTokenAddress,
		sellToken: request.sellTokenAddress,
		sellAmount:
			request.sellTokenAmount !== '' &&
			request.sellTokenAmount !== undefined
				? request.sellTokenAmount
				: null,
		taker: request.fromAddress,
		txOrigin: null,
		swapFeeRecipient:
			request.affiliate !== '' || request.affiliate !== undefined
				? request.affiliate
				: null,
		swapFeeBps: request.affiliate
			? parseInt(request.affiliateFee, 10) // ?
			: undefined,
		swapFeeToken: request.affiliate ? request.sellTokenAddress : undefined,
		tradeSurplusRecipient: request.affiliate,
		gasPrice: null,
		slippageBps: parseFloat(request.slippage) * 10000, // The slippage input is decimal, we need basis points (bps)
		excludedSources: null,
		sellEntireBalance: false,
	} as ZeroXRequestParameters;
	return parameters;
}

function normalizeZeroXResponse(
	response: ZeroXQuoteResponse,
	from: string,
	recipient: string,
	chainId: number,
): AggregatorQuote {
	const aggregatorQuote = {
		to: response.transaction ? response.transaction.to : undefined,
		data: response.transaction ? response.transaction.data : undefined,
		value: response.transaction ? response.transaction.value : undefined,
		estimatedGas: response.transaction
			? parseInt(response.transaction.gas, 10)
			: response.gas,
		buyTokenAddress: response.buyToken,
		buyAmount: response.buyAmount,
		sellTokenAddress: response.sellToken,
		sellAmount: response.sellAmount,
		allowanceTarget: ZEROX_ALLOWANCE_HOLDER_CONTRACT[chainId],
		from,
		recipient,
		tradeType: TradeType.ExactInput,
		aggregatorName: AggregatorName.ZeroX,
	} as AggregatorQuote;
	return aggregatorQuote;
}

export default async function getZeroXQuote(
	request: RequestQuote,
): Promise<Result<AggregatorQuote, RequestError>> {
	const { sellTokenAmount, fromAddress, recipient, chainId, skipValidation } =
		request;
	if (!sellTokenAmount) {
		return undefined;
	}
	const queryString = createQueryStringRequestObject(request);
	const baseUrl = 'https://api.0x.org';
	try {
		const instance = axios.create();
		instance.defaults.timeout = QUOTE_REQUEST_TIMEOUT;

		const config = {
			headers: {
				'0x-api-key': process.env.ZEROX_V2_API_KEY,
				'0x-version': 'v2',
			},
		};
		const fullUrl = `${baseUrl}${
			skipValidation
				? '/swap/allowance-holder/price'
				: '/swap/allowance-holder/quote'
		}?${qs.stringify(queryString, {
			strictNullHandling: true,
			skipNulls: true,
		})}`;

		// If skipValidation is true, we ask for a quote without calldata (/price) else, /quote
		const r = await instance.get(fullUrl, config);

		const zeroXQuoteResponse: ZeroXQuoteResponse = r.data;
		const normalizedResponse: AggregatorQuote = normalizeZeroXResponse(
			zeroXQuoteResponse,
			fromAddress,
			recipient,
			chainId,
		);
		return new Ok(normalizedResponse);
	} catch (exception) {
		logger.error(
			`ZeroX exception - ${exception?.toString()}: ${
				exception.response.data.message
			} - ${JSON.stringify(
				exception.response.data.data.details,
				null,
				4,
			)}`,
		);
		return new Err({
			statusCode: exception?.response?.status,
			data: exception?.response?.data,
		});
	}
}
