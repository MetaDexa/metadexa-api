import { BigNumber } from '@ethersproject/bignumber';
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import JSBI from 'jsbi';
import { PositionDetails } from '../types/position';
import { KROM, nativeOnChain } from '../constants/tokens';
import LIMIT_ABI from '../abis/limit-order-manager.json';
import {
	LIMIT_ORDER_MANAGER_ADDRESSES,
	PROVIDER_ADDRESS,
} from '../constants/addresses';
import logger from '../lib/logger';

interface GetV3PositionsResults {
	positions: PositionDetails[] | undefined;
	fundingBalance: CurrencyAmount<Token> | undefined;
	minBalance: CurrencyAmount<Token> | undefined;
	gasPrice: CurrencyAmount<Currency> | undefined;
}

export interface Result extends ReadonlyArray<any> {
	readonly [key: string]: any;
}

interface GetV3PositionResults {
	position: PositionDetails | undefined;
}

async function getV3PositionsFromTokenIds(
	tokenIds: BigNumber[],
	chainId: number,
): Promise<GetV3PositionsResults> {
	const web3 = new Web3(Web3.givenProvider || PROVIDER_ADDRESS[chainId]);
	const limitOrderManager = new web3.eth.Contract(
		LIMIT_ABI as AbiItem[],
		LIMIT_ORDER_MANAGER_ADDRESSES[chainId],
	);

	const txs = tokenIds.map((tokenId: BigNumber) =>
		limitOrderManager.methods.orders(tokenId).call(),
	);
	const orderResult = await Promise.all(txs);
	logger.silly(`orderResult: ${orderResult}`);

	const positions: PositionDetails[] = orderResult.map(
		(order: Result, i: number) => {
			const tokenId = tokenIds[i];
			return {
				owner: order.owner,
				tokenId,
				token0: order.token0,
				token1: order.token1,
				fee: order.fee,
				tickLower: order.tickLower,
				tickUpper: order.tickUpper,
				liquidity: order.liquidity,
				opened: order.opened,
				processed: order.processed,
				tokensOwed0: order.tokensOwed0,
				tokensOwed1: order.tokensOwed1,
			};
		},
	) as PositionDetails[];
	logger.silly(`positions ${positions}`);

	return {
		positions: positions?.map(
			(position: PositionDetails, i: number) =>
				({
					...position,
					tokenId: tokenIds[i],
				} as PositionDetails),
		),
		fundingBalance: undefined,
		minBalance: undefined,
		gasPrice: undefined,
	};
}

export async function getV3PositionFromTokenId(
	tokenId: BigNumber | undefined,
	chainId: number,
): Promise<GetV3PositionResults> {
	const position: GetV3PositionsResults = await getV3PositionsFromTokenIds(
		[tokenId],
		chainId,
	);

	return {
		position: position[0],
	};
}

export async function getV3Positions(
	account: string,
	chainId: number,
): Promise<GetV3PositionsResults> {
	try {
		const web3 = new Web3(Web3.givenProvider || PROVIDER_ADDRESS[chainId]);

		const limitOrderManager = new web3.eth.Contract(
			LIMIT_ABI as AbiItem[],
			LIMIT_ORDER_MANAGER_ADDRESSES[chainId],
		);

		const gasPriceInWei = await web3.eth.getGasPrice();
		logger.debug(`gasPriceInWei ${gasPriceInWei}`);

		// This amount is in ethers when returned using toExact() method
		// ex: gasPriceInWei = 44441506607
		// gasPrice = 0.000000044441506607 ether
		const gasPrice = CurrencyAmount.fromRawAmount(
			nativeOnChain(chainId),
			JSBI.toNumber(JSBI.BigInt(gasPriceInWei)),
		);
		const tokenIdResults = await limitOrderManager.methods
			.tokensOfOwner(account)
			.call();

		const tokenIds =
			tokenIdResults && account
				? tokenIdResults.map((tokenId: string) =>
						BigNumber.from(tokenId),
				  )
				: [];
		logger.silly(`tokenIds ${tokenIds}`);

		const positions = await getV3PositionsFromTokenIds(tokenIds, chainId);

		if (positions.positions.length === 0)
			return {
				positions: positions.positions,
				fundingBalance: undefined,
				minBalance: undefined,
				gasPrice: undefined,
			};
		const fundingResult = await limitOrderManager.methods
			.funding(account)
			.call();

		logger.silly(`fundingResult ${JSON.stringify(fundingResult, null, 4)}`);

		const fundingBalance =
			!chainId || !fundingResult
				? undefined
				: CurrencyAmount.fromRawAmount(KROM[chainId], fundingResult);

		const minBalanceResult = await limitOrderManager.methods
			.serviceFee(account, gasPriceInWei)
			.call();

		const minBalance = CurrencyAmount.fromRawAmount(
			KROM[chainId],
			minBalanceResult,
		);
		logger.silly(`minBalance ${JSON.stringify(minBalance, null, 4)}`);

		const V3PositionsResult: GetV3PositionsResults = {
			...positions,
			fundingBalance,
			minBalance,
			gasPrice,
		} satisfies GetV3PositionsResults;

		logger.silly(
			`V3PositionsResult ${JSON.stringify(V3PositionsResult, null, 4)}`,
		);
		return V3PositionsResult;
	} catch (err) {
		logger.error(`error ${JSON.stringify(err, null, 4)}`);
		return undefined;
	}
}
