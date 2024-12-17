import { Token, WETH9 } from '@uniswap/sdk-core';
import { SupportedChainId } from './chains';

const WRAPPED_NATIVE_CURRENCY: { [chainId: number]: Token } = {
	...WETH9,
	[SupportedChainId.OPTIMISM]: new Token(
		SupportedChainId.OPTIMISM,
		'0x4200000000000000000000000000000000000006',
		18,
		'WETH',
		'Wrapped Ether',
	),
	[SupportedChainId.OPTIMISTIC_KOVAN]: new Token(
		SupportedChainId.OPTIMISTIC_KOVAN,
		'0x4200000000000000000000000000000000000006',
		18,
		'WETH',
		'Wrapped Ether',
	),
	[SupportedChainId.ARBITRUM_ONE]: new Token(
		SupportedChainId.ARBITRUM_ONE,
		'0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
		18,
		'WETH',
		'Wrapped Ether',
	),
	[SupportedChainId.ARBITRUM_RINKEBY]: new Token(
		SupportedChainId.ARBITRUM_RINKEBY,
		'0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681',
		18,
		'WETH',
		'Wrapped Ether',
	),
	[SupportedChainId.POLYGON]: new Token(
		SupportedChainId.POLYGON,
		'0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
		18,
		'WMATIC',
		'Wrapped MATIC',
	),
	[SupportedChainId.POLYGON_MUMBAI]: new Token(
		SupportedChainId.POLYGON_MUMBAI,
		'0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
		18,
		'WMATIC',
		'Wrapped MATIC',
	),
	[SupportedChainId.BASE]: new Token(
		SupportedChainId.BASE,
		'0x4200000000000000000000000000000000000006',
		18,
		'WETH',
		'Wrapped Ether',
	),
};
export default WRAPPED_NATIVE_CURRENCY;
