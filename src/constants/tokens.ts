/* eslint-disable max-classes-per-file */
import { Currency, Ether, NativeCurrency, Token } from '@uniswap/sdk-core';
import { KROM_TOKEN_ADDRESSES } from './addresses';
import { SupportedChainId } from './chains';
import WRAPPED_NATIVE_CURRENCY from './token';

type AddressMap = { [chainId: number]: string };

export const SupportedChains: AddressMap = {
	[SupportedChainId.POLYGON]: 'POLYGON',
	[SupportedChainId.MAINNET]: 'ETHEREUM',
	[SupportedChainId.ARBITRUM_ONE]: 'ARBITRUM',
	[SupportedChainId.OPTIMISM]: 'OPTIMISM',
	[SupportedChainId.BASE]: 'BASE',
};

export function isMatic(
	chainId: number,
): chainId is SupportedChainId.POLYGON | SupportedChainId.POLYGON_MUMBAI {
	return (
		chainId === SupportedChainId.POLYGON_MUMBAI ||
		chainId === SupportedChainId.POLYGON
	);
}

class MaticNativeCurrency extends NativeCurrency {
	public constructor(chainId: number) {
		if (!isMatic(chainId)) throw new Error('Not matic');
		super(chainId, 18, 'MATIC', 'Polygon Matic');
	}

	get wrapped(): Token {
		if (!isMatic(this.chainId)) throw new Error('Not matic');
		return WRAPPED_NATIVE_CURRENCY[this.chainId];
	}

	equals(other: Currency): boolean {
		return other.isNative && other.chainId === this.chainId;
	}
}

export class ExtendedEther extends Ether {
	private static _cachedExtendedEther: { [chainId: number]: NativeCurrency } =
		{};

	public get wrapped(): Token {
		if (this.chainId in WRAPPED_NATIVE_CURRENCY)
			return WRAPPED_NATIVE_CURRENCY[this.chainId];
		throw new Error('Unsupported chain ID');
	}

	public static onChain(chainId: number): ExtendedEther {
		return (
			this._cachedExtendedEther[chainId] ??
			(this._cachedExtendedEther[chainId] = new ExtendedEther(chainId))
		);
	}
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrency } = {};

export function nativeOnChain(chainId: number): NativeCurrency {
	return (
		cachedNativeCurrency[chainId] ??
		(cachedNativeCurrency[chainId] = isMatic(chainId)
			? new MaticNativeCurrency(chainId)
			: ExtendedEther.onChain(chainId))
	);
}

export const CHAIN_NATIVE_TOKEN = {
	[SupportedChainId.ARBITRUM_ONE]:
		'0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
	[SupportedChainId.MAINNET]: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
	[SupportedChainId.POLYGON]: '0x0000000000000000000000000000000000001010',
	[SupportedChainId.OPTIMISM]: '0x4200000000000000000000000000000000000006',
	[SupportedChainId.BASE]: '0x4200000000000000000000000000000000000006',
};

export const KROM: { [chainId: number]: Token } = {
	[SupportedChainId.KOVAN]: new Token(
		SupportedChainId.KOVAN,
		KROM_TOKEN_ADDRESSES[SupportedChainId.KOVAN],
		18,
		'KROM',
		'Kromatika',
	),
	[SupportedChainId.OPTIMISTIC_KOVAN]: new Token(
		SupportedChainId.OPTIMISTIC_KOVAN,
		KROM_TOKEN_ADDRESSES[SupportedChainId.OPTIMISTIC_KOVAN],
		18,
		'KROM',
		'Kromatika',
	),
	[SupportedChainId.OPTIMISM]: new Token(
		SupportedChainId.OPTIMISM,
		KROM_TOKEN_ADDRESSES[SupportedChainId.OPTIMISM],
		18,
		'KROM',
		'Kromatika',
	),
	[SupportedChainId.ARBITRUM_RINKEBY]: new Token(
		SupportedChainId.ARBITRUM_RINKEBY,
		KROM_TOKEN_ADDRESSES[SupportedChainId.ARBITRUM_RINKEBY],
		18,
		'KROM',
		'Kromatika',
	),
	[SupportedChainId.ARBITRUM_ONE]: new Token(
		SupportedChainId.ARBITRUM_ONE,
		KROM_TOKEN_ADDRESSES[SupportedChainId.ARBITRUM_ONE],
		18,
		'KROM',
		'Kromatika',
	),
	[SupportedChainId.MAINNET]: new Token(
		SupportedChainId.MAINNET,
		KROM_TOKEN_ADDRESSES[SupportedChainId.MAINNET],
		18,
		'KROM',
		'Kromatika',
	),
	[SupportedChainId.POLYGON]: new Token(
		SupportedChainId.POLYGON,
		KROM_TOKEN_ADDRESSES[SupportedChainId.POLYGON],
		18,
		'KROM',
		'Kromatika',
	),
	[SupportedChainId.BASE]: new Token( // todo*: edit this when KROM is deployed on BASE
		SupportedChainId.BASE,
		KROM_TOKEN_ADDRESSES[SupportedChainId.BASE],
		18,
		'KROM',
		'Kromatika',
	),
};
