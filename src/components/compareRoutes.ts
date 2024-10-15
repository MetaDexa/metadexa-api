import { Err, Result } from 'ts-results';
import { RequestError } from '../interfaces/RequestError';
import { AggregatorQuote } from '../interfaces/AggregatorQuote';
import logger from '../lib/logger';

export default function compareRoutes(
	quoteArray: Result<AggregatorQuote, RequestError>[],
): Result<AggregatorQuote, RequestError> {
	// Sorting from highest (better) quote to lowest
	const bestQuotes = quoteArray.sort((a, b) => {
		const aData = a.unwrap();
		const bData = b.unwrap();
		return (
			parseInt(bData.buyAmount, 10) - parseInt(aData.buyAmount, 10) ||
			aData.estimatedGas - bData.estimatedGas
		);
	});

	bestQuotes.forEach((quote) => {
		const quoteData = quote.unwrap();
		logger.debug({
			amount: quoteData.buyAmount,
			from: quoteData.aggregatorName,
			gas: quoteData.estimatedGas,
		});
	});
	logger.info({
		buyAmount: bestQuotes[0].unwrap().buyAmount,
		from: bestQuotes[0].unwrap().aggregatorName,
		gas: bestQuotes[0].unwrap().estimatedGas,
	});

	if (bestQuotes.length > 0) {
		return bestQuotes[0];
	}

	return new Err({
		statusCode: 404,
		data: 'Aggregator Route Not Found',
	});
}
