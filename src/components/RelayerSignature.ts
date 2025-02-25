import { Err, Ok, Result } from 'ts-results';
import {
	createWalletClient,
	http,
	keccak256,
	encodePacked, getAddress,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { RequestError } from '../interfaces/RequestError';
import { PROVIDER_ADDRESS } from '../constants/addresses';
import { ForwarderRequest } from '../interfaces/ForwarderRequest';

export default async function validatorSign(
	forwardRequest: ForwarderRequest,
	chainId: number,
	from: string,
	forwarderAddress: string,
): Promise<Result<string, RequestError>> {
	try {

		const account = privateKeyToAccount(`0x${environment.relayerSecretKey }`);

		// Create the hash message using viem's encodePacked and keccak256
		const hashData = encodePacked(
			['uint256', 'address', 'address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'address', 'bytes'],
			[
				BigInt(chainId),
				getAddress(from),
				getAddress(forwarderAddress),
				getAddress(forwardRequest.signer),
				getAddress(forwardRequest.paymentToken),
				BigInt(forwardRequest.paymentFees),
				BigInt(forwardRequest.tokenGasPrice),
				BigInt(forwardRequest.validTo),
				BigInt(forwardRequest.nonce),
				getAddress(forwardRequest.metaswap),
				forwardRequest.calldata as `0x${string}`,
			]
		);

		const messageHash = keccak256(hashData);

		// Sign the message
		const signature = await account.signMessage({
			message: { raw: messageHash }
		});

		return new Ok(signature);

	} catch (error) {
		return new Err({
			statusCode: 500,
			data: `Cannot sign message: ${error}`,
		});
	}
}

export async function getSigner(): Promise<string> {
	const account = privateKeyToAccount(`0x${environment.relayerSecretKey }`);
	return account.address;
}