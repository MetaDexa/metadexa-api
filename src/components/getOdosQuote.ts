/** @format */
import axios from 'axios';

import { Ok, Err, Result } from 'ts-results';
import { OdosAssembleRequestParameters } from '../interfaces/Odos/OdosAssembleRequestParameters';
import { ODOS_AGGREGATOR_ADDRESS } from '../constants/addresses';
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
import logger from '../lib/logger';

function createQueryStringRequestObject(
	request: RequestQuote,
): OdosQuoteRequestParameters {
	return {
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
	} as OdosQuoteRequestParameters;
}

function normalizeOdosResponse(
	quoteResponse: OdosQuoteResponse,
	assembleResponse: OdosAssembleResponse,
	isSellAmount: boolean,
	from: string,
	recipient: string,
	chainId: string | number,
): AggregatorQuote {
	// console.log('error here', quoteResponse);
	const normalizedResponse: AggregatorQuote = {
		to: assembleResponse.transaction.to,
		data: assembleResponse.transaction.data,
		value: assembleResponse.transaction.value.toString(),
		estimatedGas: assembleResponse.gasEstimate,
		buyTokenAddress:
			quoteResponse.outTokens[0] ===
			'0x0000000000000000000000000000000000000000'
				? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
				: quoteResponse.outTokens[0],
		buyAmount: assembleResponse.outputTokens[0].amount.toString(),
		sellTokenAddress:
			quoteResponse.inTokens[0] ===
			'0x0000000000000000000000000000000000000000'
				? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
				: quoteResponse.inTokens[0],
		sellAmount: assembleResponse.inputTokens[0].amount.toString(),
		allowanceTarget: ODOS_AGGREGATOR_ADDRESS[chainId],
		from,
		recipient,
		tradeType: isSellAmount ? TradeType.ExactInput : TradeType.ExactOutput,
		aggregatorName: AggregatorName.Odos,
	};
	return normalizedResponse;
}

export default async function getOdosQuote(
	request: RequestQuote,
): Promise<Result<AggregatorQuote, RequestError>> {
	const { sellTokenAmount, fromAddress, recipient, chainId } = request;
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
		instance.defaults.timeout = 5000;

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
