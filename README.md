# MetaDexa - Trading API 
In the current repository, there is a simple NodeJS server which serves as a trading API. You can ping one of the routes and get the best aggregated quotes for given trading pair.

## Installation 

``` bash
1. git clone https://github.com/MetaDexa/metadexa-api.git 
2. cd ../path_to_folder/metadexa-api (Navigate to the project root folder and run)
3. npm install 
```

## Usage 

``` bash
1. cd ../path_to_folder/metadexa-api (Navigate to the project root folder and run)
2. npm run start 
```

## Methods

- GET `/v1.0/{chainId}/getQuote` - Fetches the best aggregated quotes for given trading pair
  - Request - example: 
  https://api.metadexa.io/v1.0/137/getQuote?buyTokenAddress=0x14Af1F2f02DCcB1e43402339099A05a5E363b83c&skipValidation=true&sellTokenAmount=10000000&fromAddress=0xe26F8f8A14251425Dd4E7f59f14eE5C0c2568956&sellTokenAddress=0xc2132D05D31c914a87C6611C10748AEb04B58e8F&slippage=0.005

  - Response - example: 
```javascript
{
  "estimatedGas": "317950",
  "buyTokenAddress": "0x14af1f2f02dccb1e43402339099a05a5e363b83c",
  "buyAmount": "153528184308886079382",
  "sellTokenAddress": "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
  "sellAmount": "10000000",
  "allowanceTarget": "0x6afD834f6e3D5ad5A83E7838ca45F3DBDe3E323d"
}
```

- GET `/v1.0/{chainId}/getGaslessQuote` - Fetches the best Gasless aggregated quotes for given trading pair
  - Request - example: 
  https://api.metadexa.io/v1.0/137/getGaslessQuote?buyTokenAddress=0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270&skipValidation=true&sellTokenAmount=10000000&fromAddress=0xe26F8f8A14251425Dd4E7f59f14eE5C0c2568956&sellTokenAddress=0x14Af1F2f02DCcB1e43402339099A05a5E363b83c&slippage=0.005

  - Response - example: 
```javascript
{
  "estimatedGas": "240000",
  "paymentTokenAddress": "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  "paymentFees": "0",
  "buyTokenAddress": "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  "buyAmount": "875353",
  "sellTokenAddress": "0x14af1f2f02dccb1e43402339099a05a5e363b83c",
  "sellAmount": "10000000",
  "allowanceTarget": "0x6afD834f6e3D5ad5A83E7838ca45F3DBDe3E323d"
}
```

## Swagger Documentation
https://app.swaggerhub.com/apis/ElFuerte90/MetaDexa-API/1.0

## Contributing 
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.


## License 
[MIT License](https://choosealicense.com/licenses/mit/)
