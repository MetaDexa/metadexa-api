import Web3 from 'web3';
import { Ok, Err, Result } from 'ts-results';
import {
	WHITELISTED_TOKENS,
	GAS_OVERHEAD,
	FREE_SWAPS_CAMPAIGN,
} from '../constants/constants';
import { ResultQuote } from '../interfaces/ResultQuote';
import { RequestError } from '../interfaces/RequestError';
import {
	FORWARDER_ADDRESS,
	METASWAP_ROUTER_CONTRACT_ADDRESS,
	PROVIDER_ADDRESS,
} from '../constants/addresses';
import { AggregatorQuote } from '../interfaces/AggregatorQuote';
import { RequestQuote } from '../interfaces/RequestQuote';
import { ResultGaslessQuote } from '../interfaces/ResultGaslessQuote';
import getBestQuote from './GetBestQuote';
import validatorSign, { getSigner } from './RelayerSignature';
import { ForwarderRequest } from '../interfaces/ForwarderRequest';
import { CompositeQuote } from '../interfaces/CompositeQuote';
import simulateTransaction, {
	buildGaslessAggregatorCallData,
	getTransactionData,
} from './utils';

async function getGasPrice(chainId: number): Promise<Result<string, Error>> {
	const web3 = new Web3(Web3.givenProvider || PROVIDER_ADDRESS[chainId]);
	try {
		const gasPrice = await web3.eth.getGasPrice();
		return new Ok(gasPrice);
	} catch (error) {
		return new Err(new Error(`Gas price failed: ${error.message}`));
	}
}

// todo: add suppport for affiliate
async function getValidatorGaslessQuote(
	request: RequestQuote,
	aggregatorQuote: AggregatorQuote,
	resultQuote: ResultQuote,
	paymentToken: string,
	gasFees: string,
): Promise<Result<ResultGaslessQuote, RequestError>> {
	let paymentFees: string;
	let aggrQuote: CompositeQuote;
	paymentFees = gasFees;
	if (paymentToken === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
		paymentFees = gasFees;
	} else if (gasFees !== '0') {
		const paymentTokenQuote: RequestQuote = {
			chainId: request.chainId,
			fromAddress: '0x0000000000000000000000000000000000000000',
			sellTokenAddress: paymentToken,
			buyTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
			sellTokenAmount: undefined,
			buyTokenAmount: gasFees,
			recipient: undefined,
			slippage: '0',
			affiliate: undefined,
			affiliateFee: undefined, // todo: add support for this
			skipValidation: true,
			signaturePermitData: undefined,
		};
		const exactOutputQuote: Result<CompositeQuote, RequestError> =
			await getBestQuote(paymentTokenQuote, true);

		if (exactOutputQuote.err) {
			return exactOutputQuote;
		}
		aggrQuote = exactOutputQuote.unwrap();
		paymentFees = aggrQuote.resultQuote.sellAmount;
	} else if (gasFees === '0') {
		aggrQuote.aggregatorQuote = aggregatorQuote;
	}

	if (request.skipValidation) {
		return new Ok({
			estimatedGas: resultQuote.estimatedGas,
			paymentTokenAddress: paymentToken,
			paymentFees,
			buyTokenAddress: resultQuote.buyTokenAddress,
			buyAmount: resultQuote.buyAmount,
			sellTokenAddress: resultQuote.sellTokenAddress,
			sellAmount: resultQuote.sellAmount,
			allowanceTarget: resultQuote.allowanceTarget,
			tx: undefined,
		});
	}
	// validation not skipped;

	const signer = await getSigner(request.chainId);

	// start building calldata
	const aggregatorCallData = buildGaslessAggregatorCallData(
		aggregatorQuote,
		request.slippage,
		paymentToken,
		paymentFees,
		signer,
		request.chainId,
	);

	if (aggregatorCallData.err) {
		return aggregatorCallData;
	}

	// build and sign forwarder request
	const minutesToAdd = 10;
	const nonce = new Date().getTime();
	const validTo = new Date(nonce + minutesToAdd * 60000).getTime();
	const calldata = aggregatorCallData.unwrap();

	const forwarderRequest: ForwarderRequest = {
		signer,
		metaswap: METASWAP_ROUTER_CONTRACT_ADDRESS[request.chainId],
		calldata,
		paymentToken,
		paymentFees,
		tokenGasPrice: '0',
		validTo,
		nonce,
	};

	const validatorSignature = await validatorSign(
		forwarderRequest,
		request.chainId,
		request.fromAddress,
		FORWARDER_ADDRESS[request.chainId],
	);
	if (validatorSignature.err) {
		return validatorSignature;
	}

	// build txn data
	const txData = await getTransactionData(
		forwarderRequest,
		validatorSignature.unwrap(),
		request.fromAddress,
		resultQuote.tx.gasPrice,
		request.chainId,
	);
	if (txData.err) {
		return txData;
	}

	const simulationResult = await simulateTransaction(
		request.chainId,
		request.slippage,
		resultQuote,
		aggregatorQuote,
		paymentToken,
		paymentFees,
		aggrQuote,
		txData.unwrap(),
		signer,
		gasFees,
	);

	if (simulationResult.err) {
		return simulationResult;
	}

	return new Ok({
		estimatedGas: resultQuote.estimatedGas,
		paymentTokenAddress: paymentToken,
		paymentFees,
		buyTokenAddress: resultQuote.buyTokenAddress,
		buyAmount: resultQuote.buyAmount,
		sellTokenAddress: resultQuote.sellTokenAddress,
		sellAmount: resultQuote.sellAmount,
		allowanceTarget: resultQuote.allowanceTarget,
		tx: txData.unwrap(),
	});
}

function getGasFees(
	request: RequestQuote,
	gasPrice: any,
	estimatedGas: number,
) {
	const web3 = new Web3();
	if (FREE_SWAPS_CAMPAIGN[request.chainId]) return web3.utils.toBN('0');

	// todo: add check for whitelisted tokens here

	// todo: add check for whitelisted users here

	return web3.utils
		.toBN(gasPrice.unwrap())
		.mul(web3.utils.toBN(estimatedGas).add(web3.utils.toBN(GAS_OVERHEAD)));
}

export default async function getGaslessQuote(
	request: RequestQuote,
): Promise<Result<ResultGaslessQuote, RequestError>> {
	const data: Result<CompositeQuote, RequestError> = await getBestQuote(
		request,
		true,
	);

	if (data.err) {
		return data;
	}
	const { resultQuote } = data.unwrap();
	const { aggregatorQuote } = data.unwrap();
	const gasPrice = resultQuote.tx?.gasPrice
		? new Ok(resultQuote.tx.gasPrice)
		: await getGasPrice(request.chainId);

	if (gasPrice.err) {
		return new Err({
			statusCode: 500,
			data: `gas price failed: ${gasPrice.val}`,
		});
	}

	const estimatedGas: number = resultQuote.tx
		? resultQuote.tx.gas
		: resultQuote.estimatedGas;

	const gasFees = getGasFees(request, gasPrice, estimatedGas);

	const paymentToken: string = resultQuote.buyTokenAddress;

	// todo: add support for affiliate
	return getValidatorGaslessQuote(
		request,
		aggregatorQuote,
		resultQuote,
		paymentToken,
		gasFees.toString(),
	);
}
