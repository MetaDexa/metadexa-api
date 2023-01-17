/** @format */

// eslint-disable-next-line import/prefer-default-export
export const GAS_OVERHEAD = '130000';

export const GAS_MARGIN = 95;

export const FREE_SWAPS_CAMPAIGN = {
	'137': true,
};

export const WHITELISTED_TOKENS = [
	{
		/* 
		follow the template:
		'chainId' : ['tokenAddress1', 'tokenAddress2', ...]
		*/
		'137': [	// not enabled, it is just an example as of now;
			'0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
			'0x14Af1F2f02DCcB1e43402339099A05a5E363b83c',
		],
	},
];

// idea for future purposes;
// export const WHITELISTED_ADDRESSES = [
// 	{
// 		'chainId' : ['userAddress1', 'userAddress2', ...]
// 	},
// ];
