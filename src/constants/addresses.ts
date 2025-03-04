import { SupportedChainId } from './tokens';

type AddressMap = { [chainId: number]: string };

// eslint-disable-next-line import/prefer-default-export
export const METASWAP_ROUTER_CONTRACT_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0x6afD834f6e3D5ad5A83E7838ca45F3DBDe3E323d',
	[SupportedChainId.ARBITRUM_ONE]:
		'0x4ab78b894611f185Cd7378E25C8f80d63cfBAa71',
	[SupportedChainId.OPTIMISM]: '0x6FE9F5616Ac30E0A66B5Bc68D05F081471835bf7',
	[SupportedChainId.MAINNET]: '0x8F42F726e9222DbBd8958D006aa88F1d2D8e6D91',
	[SupportedChainId.BASE]: '0x8F42F726e9222DbBd8958D006aa88F1d2D8e6D91',
};

export const MULTICALL_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0x7a1C1dc2a1B6d19135aDD10821dF70132A7f4E84',
	[SupportedChainId.ARBITRUM_ONE]:
		'0xd653508F889157B49f6003bC8E69B766946bA138',
	[SupportedChainId.OPTIMISM]: '0x0BF7C25F4CB02d740677002620A9812E20ef91CB',
	[SupportedChainId.MAINNET]: '0x1Bb73CfCCa1f26DCbB84ab3BcC70Ba792F2aD22b',
	[SupportedChainId.BASE]: '0x8F42F726e9222DbBd8958D006aa88F1d2D8e6D91',
};

export const FORWARDER_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0x316766609569e00c3484fE9e558A35b975064a62',
	[SupportedChainId.ARBITRUM_ONE]:
		'0x026D63A16a5c1C28e49539780aef7fb47eb89eC4',
	[SupportedChainId.OPTIMISM]: '0x65f4C9756A65cCd3AEA91e92AAE7d01C54425940',
	[SupportedChainId.MAINNET]: '0x7506145777371640e4a3642F5E34A9e0495e4591',
	[SupportedChainId.BASE]: '0x8F42F726e9222DbBd8958D006aa88F1d2D8e6D91',
};

// eslint-disable-next-line import/prefer-default-export
export const FLASH_WALLET: AddressMap = {
	[SupportedChainId.POLYGON]: '0xDdBE6Efb0d5A2bf9ABA843290D7a69f4db03Bfdd',
	[SupportedChainId.ARBITRUM_ONE]:
		'0x58759Ec99baF2A5b9cA990f429370A676aA886BF',
	[SupportedChainId.OPTIMISM]: '0x9d0827A272b9E1C354Fc7a15d68c37153FaA35aa',
	[SupportedChainId.MAINNET]: '0x672b34f496b267e6002d5248030e944db8375628', // todo: review this address when mainnet gasless happens
	[SupportedChainId.BASE]: '0x8F42F726e9222DbBd8958D006aa88F1d2D8e6D91',
};

export const ONEINCH_AGGREGATOR_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
	[SupportedChainId.ARBITRUM_ONE]:
		'0x1111111254fb6c44bAC0beD2854e76F90643097d',
	[SupportedChainId.OPTIMISM]: '0x1111111254760f7ab3f16433eea9304126dcd199',
	[SupportedChainId.MAINNET]: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
	[SupportedChainId.BASE]: '0x8F42F726e9222DbBd8958D006aa88F1d2D8e6D91',
};

export const ZEROX_AGGREGATOR_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF',
	[SupportedChainId.OPTIMISM]: '0xdef1abe32c034e558cdd535791643c58a13acc10',
	[SupportedChainId.MAINNET]: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
	[SupportedChainId.BASE]: '0x8F42F726e9222DbBd8958D006aa88F1d2D8e6D91',
};

// See https://docs.odos.xyz/product/sor/v2/#deployments
export const ODOS_AGGREGATOR_ADDRESS: AddressMap = {
	[SupportedChainId.MAINNET]: '0xCf5540fFFCdC3d510B18bFcA6d2b9987b0772559',
	[SupportedChainId.POLYGON]: '0x4E3288c9ca110bCC82bf38F09A7b425c095d92Bf',
	[SupportedChainId.OPTIMISM]: '0xCa423977156BB05b13A2BA3b76Bc5419E2fE9680',
	[SupportedChainId.ARBITRUM_ONE]:
		'0xa669e7A0d4b3e4Fa48af2dE86BD4CD7126Be4e13',
	[SupportedChainId.BASE]: '0x19cEeAd7105607Cd444F5ad10dd51356436095a1',
	// these are the addresses for the other chains that we don't support yet
	// [SupportedChainId.MANTLE]: '0xD9F4e85489aDCD0bAF0Cd63b4231c6af58c26745',
	// [SupportedChainId.SCROLL]: '0xbFe03C9E20a9Fc0b37de01A172F207004935E0b1',
	// [SupportedChainId.LINEA]: '0x2d8879046f1559E53eb052E949e9544bCB72f414',
	// [SupportedChainId.ZKSYNC]: '0x4bBa932E9792A2b917D47830C93a9BC79320E4f7',
	// [SupportedChainId.MODE]: '0x7E15EB462cdc67Cf92Af1f7102465a8F8c784874',
	// [SupportedChainId.AVALANCHE]: '0x88de50B233052e4Fb783d4F6db78Cc34fEa3e9FC',
	// [SupportedChainId.BNB]: '0x89b8AA89FDd0507a99d334CBe3C808fAFC7d850E',
	// [SupportedChainId.FTM]: '0xD0c22A5435F4E8E5770C1fAFb5374015FC12F7cD',
};

export const PROVIDER_ADDRESS: AddressMap = {
	[SupportedChainId.POLYGON]:
		'https://rpc.ankr.com/polygon/3447c266673af57685b798ee810755b73450b3e97749a600f88473bdf1678f64',
	[SupportedChainId.ARBITRUM_ONE]:
		'https://rpc.ankr.com/arbitrum/3447c266673af57685b798ee810755b73450b3e97749a600f88473bdf1678f64',
	[SupportedChainId.MAINNET]:
		'https://rpc.ankr.com/eth/3447c266673af57685b798ee810755b73450b3e97749a600f88473bdf1678f64',
	[SupportedChainId.OPTIMISM]:
		'https://rpc.ankr.com/optimism/3447c266673af57685b798ee810755b73450b3e97749a600f88473bdf1678f64',
	[SupportedChainId.BASE]:
		'https://rpc.ankr.com/base/3447c266673af57685b798ee810755b73450b3e97749a600f88473bdf1678f64',
};

export const ANKR_PROVIDER_URL: AddressMap = {
	[SupportedChainId.POLYGON]:
		'https://rpc.ankr.com/polygon/3447c266673af57685b798ee810755b73450b3e97749a600f88473bdf1678f64',
	[SupportedChainId.ARBITRUM_ONE]:
		'https://rpc.ankr.com/arbitrum/3447c266673af57685b798ee810755b73450b3e97749a600f88473bdf1678f64',
	[SupportedChainId.MAINNET]:
		'https://rpc.ankr.com/eth/3447c266673af57685b798ee810755b73450b3e97749a600f88473bdf1678f64',
	[SupportedChainId.OPTIMISM]:
		'https://rpc.ankr.com/optimism/3447c266673af57685b798ee810755b73450b3e97749a600f88473bdf1678f64',
	[SupportedChainId.BASE]:
		'https://rpc.ankr.com/base/3447c266673af57685b798ee810755b73450b3e97749a600f88473bdf1678f64',
};

export const ALCHEMY_PROVIDER_URL: AddressMap = {
	[SupportedChainId.POLYGON]:
		'https://polygon-mainnet.g.alchemy.com/v2/2XhoUzltnF5XtxlWvMi78ksAQIsZeILH',
	[SupportedChainId.ARBITRUM_ONE]:
		'https://arb-mainnet.g.alchemy.com/v2/2XhoUzltnF5XtxlWvMi78ksAQIsZeILH',
	[SupportedChainId.MAINNET]:
		'https://eth-mainnet.g.alchemy.com/v2/2XhoUzltnF5XtxlWvMi78ksAQIsZeILH',
	[SupportedChainId.OPTIMISM]:
		'https://opt-mainnet.g.alchemy.com/v2/2XhoUzltnF5XtxlWvMi78ksAQIsZeILH',
	[SupportedChainId.BASE]:
		'https://base-mainnet.g.alchemy.com/v2/2XhoUzltnF5XtxlWvMi78ksAQIsZeILH',
};

export const INFURA_PROVIDER_URL: AddressMap = {
	[SupportedChainId.POLYGON]:
		'https://polygon-mainnet.infura.io/v3/e37acc9b5b1a4378b9120d7f12a77700',
	[SupportedChainId.ARBITRUM_ONE]:
		'https://arbitrum-mainnet.infura.io/v3/e37acc9b5b1a4378b9120d7f12a77700',
	[SupportedChainId.MAINNET]:
		'https://mainnet.infura.io/v3/e37acc9b5b1a4378b9120d7f12a77700',
	[SupportedChainId.OPTIMISM]:
		'https://optimism-mainnet.infura.io/v3/e37acc9b5b1a4378b9120d7f12a77700',
	[SupportedChainId.BASE]:
		'https://base-mainnet.infura.io/v3/e37acc9b5b1a4378b9120d7f12a77700',
};
