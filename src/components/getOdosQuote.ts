import axios from 'axios';

import { Ok, Err, Result } from 'ts-results';

import logger from '../lib/logger';
import { OdosAssembleRequestParameters } from '../interfaces/Odos/OdosAssembleRequestParameters';
import { ODOS_AGGREGATOR_ADDRESS } from '../constants/addresses';
import { QUOTE_REQUEST_TIMEOUT } from '../constants/constants';
import {
	AggregatorName,
	AggregatorQuote,
	TradeType,
} from '../interfaces/AggregatorQuote';
import { RequestError } from '../interfaces/RequestError';
import { RequestQuote } from '../interfaces/RequestQuote';
import { OdosQuoteRequestParameters } from '../interfaces/Odos/OdosQuoteRequestParameters';
import { OdosAssembleResponse } from '../interfaces/Odos/OdosAssembleResponse';
import { OdosQuoteResponse } from '../interfaces/Odos/OdosQuoteResponse';

function createQueryStringRequestObject(
	request: RequestQuote,
): OdosQuoteRequestParameters {
	const requestParams: OdosQuoteRequestParameters = {
		chainId: request.chainId,
		compact: true,
		inputTokens: [
			{
				tokenAddress:
					request.sellTokenAddress ===
					'0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
						? '0x0000000000000000000000000000000000000000'
						: request.sellTokenAddress,
				amount: request.sellTokenAmount,
			},
		],
		outputTokens: [
			{
				proportion: 1,
				tokenAddress:
					request.buyTokenAddress ===
					'0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
						? '0x0000000000000000000000000000000000000000'
						: request.buyTokenAddress,
			},
		],
		slippageLimitPercent: parseFloat(request.slippage),
		userAddr: request.fromAddress,
	};
	return requestParams;
}

function normalizeOdosResponse(
	quoteResponse: OdosQuoteResponse,
	assembleResponse: OdosAssembleResponse | undefined,
	isSellAmount: boolean,
	from: string,
	recipient: string,
	chainId: string | number,
): AggregatorQuote {
	const normalizedResponse: AggregatorQuote = {
		to: assembleResponse ? assembleResponse.transaction.to : undefined,
		data: assembleResponse ? assembleResponse.transaction.data : undefined,
		value: assembleResponse
			? assembleResponse.transaction.value.toString()
			: quoteResponse.outValues[0].toString(),
		estimatedGas: assembleResponse
			? assembleResponse.gasEstimate
			: quoteResponse.gasEstimate,
		buyTokenAddress:
			quoteResponse.outTokens[0] ===
			'0x0000000000000000000000000000000000000000'
				? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
				: quoteResponse.outTokens[0],
		buyAmount: assembleResponse
			? assembleResponse.outputTokens[0].amount.toString()
			: quoteResponse.outAmounts[0],
		sellTokenAddress:
			quoteResponse.inTokens[0] ===
			'0x0000000000000000000000000000000000000000'
				? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
				: quoteResponse.inTokens[0],
		sellAmount: assembleResponse
			? assembleResponse.inputTokens[0].amount.toString()
			: quoteResponse.inAmounts[0],
		allowanceTarget: ODOS_AGGREGATOR_ADDRESS[chainId],
		from,
		recipient: recipient || undefined,
		tradeType: isSellAmount ? TradeType.ExactInput : TradeType.ExactOutput,
		aggregatorName: AggregatorName.Odos,
	};
	return normalizedResponse;
}

export default async function getOdosQuote(
	request: RequestQuote,
): Promise<Result<AggregatorQuote, RequestError>> {
	const {
		sellTokenAmount,
		fromAddress,
		recipient,
		chainId,
		skipValidation,
		affiliate,
		affiliateFee,
	} = request;
	if (!fromAddress || fromAddress === '' || fromAddress === '0x') {
		return new Err({
			statusCode: 400,
			data: 'Invalid from address',
		});
	}
	const odosQuoteRequestParameters: OdosQuoteRequestParameters =
		createQueryStringRequestObject(request);
	const odosQuoteEndpoint = 'https://api.odos.xyz/sor/quote/v2';
	const assembleEndpoint = 'https://api.odos.xyz/sor/assemble';
	try {
		const instance = axios.create();
		instance.defaults.timeout = QUOTE_REQUEST_TIMEOUT;

		const odosRequestHeader = {
			headers: { 'Content-Type': 'application/json' },
		};
		const r = await instance.post(
			odosQuoteEndpoint,
			odosQuoteRequestParameters,
			odosRequestHeader,
		);

		if (r.status !== 200) {
			throw r;
		}

		const quoteResponse = r.data as OdosQuoteResponse;
		logger.debug('odos quote data', quoteResponse);

		if (
			!quoteResponse.pathId ||
			quoteResponse.inAmounts[0] === '0' ||
			quoteResponse.outAmounts[0] === '0'
		) {
			return new Err({
				statusCode: 500,
				data: 'Odos Quote failed',
			});
		}
		// Finish here if we are skipping validation
		if (skipValidation === true) {
			const normalizeodosResponse: AggregatorQuote =
				normalizeOdosResponse(
					quoteResponse,
					undefined,
					!!sellTokenAmount,
					fromAddress,
					recipient,
					chainId,
				);
			return new Ok(normalizeodosResponse);
		}
		// Fetch the built calldata for the quote
		const assembleRequestParameters: OdosAssembleRequestParameters = {
			userAddr: fromAddress,
			pathId: quoteResponse.pathId,
			simulate: true,
		};

		const r2 = await instance.post(
			assembleEndpoint,
			assembleRequestParameters,
			odosRequestHeader,
		);
		if (r2.status !== 200) {
			throw r2;
		}
		logger.debug('assemble request status', r2.status);
		const assembleResponse: OdosAssembleResponse = r2.data;
		logger.debug('assembleResponse', assembleResponse);
		const normalizeodosResponse: AggregatorQuote = normalizeOdosResponse(
			quoteResponse,
			assembleResponse,
			!!sellTokenAmount,
			fromAddress,
			recipient,
			chainId,
		);
		return new Ok(normalizeodosResponse);
	} catch (exception) {
		logger.error(
			`Odos exception - status code: ${exception?.toString()} `,
			exception?.toString(),
		);
		return new Err({
			statusCode: exception?.response?.status,
			data: exception?.response?.data,
		});
	}
}
