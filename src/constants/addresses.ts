/** @format */

import { SupportedChainId } from './tokens';

type AddressMap = { [chainId: number]: string };

// eslint-disable-next-line import/prefer-default-export
export const METASWAP_ROUTER_CONTRACT_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0x6afD834f6e3D5ad5A83E7838ca45F3DBDe3E323d',
	[SupportedChainId.ARBITRUM_ONE]:
		'0x4ab78b894611f185Cd7378E25C8f80d63cfBAa71',
};

export const MULTICALL_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0x7a1C1dc2a1B6d19135aDD10821dF70132A7f4E84',
	[SupportedChainId.ARBITRUM_ONE]:
		'0xd653508F889157B49f6003bC8E69B766946bA138',
};

export const FORWARDER_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0x316766609569e00c3484fE9e558A35b975064a62',
	[SupportedChainId.ARBITRUM_ONE]:
		'0x026D63A16a5c1C28e49539780aef7fb47eb89eC4',
};

// eslint-disable-next-line import/prefer-default-export
export const FLASH_WALLET: AddressMap = {
	[SupportedChainId.POLYGON]: '0xDdBE6Efb0d5A2bf9ABA843290D7a69f4db03Bfdd',
	[SupportedChainId.ARBITRUM_ONE]:
		'0x58759Ec99baF2A5b9cA990f429370A676aA886BF',
};

export const ONEINCH_AGGREGATOR_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
	[SupportedChainId.ARBITRUM_ONE]:
		'0x1111111254fb6c44bAC0beD2854e76F90643097d',
	[SupportedChainId.OPTIMISM]: '0x1111111254760f7ab3f16433eea9304126dcd199',
	[SupportedChainId.MAINNET]: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
};

export const ZEROX_AGGREGATOR_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF',
};

export const PROVIDER_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: 'https://polygon-rpc.com',
	[SupportedChainId.ARBITRUM_ONE]:
		'https://arbitrum.blockpi.network/v1/rpc/public',
	[SupportedChainId.MAINNET]:
		'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
	[SupportedChainId.OPTIMISM]: 'https://mainnet.optimism.io',
};
