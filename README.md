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

- GET `/v1.0/{chainId}/getQuote` - Fetches the best aggregated quotes for given trading pair. The transaction is not validated, which means it is not ready for execution. Supported chains are Ethereum mainnet, Arbitrum, Optimism, Polygon, Base.
  - Request - example: 
  https://api.metadexa.io/v1.0/137/getQuote?fromAddress=0x3510D70e9fFcF31C2Cb7c000CD65B0Ff2272CE66&sellTokenAddress=0x14Af1F2f02DCcB1e43402339099A05a5E363b83c&buyTokenAddress=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&sellTokenAmount=631516806119675496697&slippage=0.005&skipValidation=true

  - Request: query parameters
```javascript
{
    "fromAddress": "address of txn executor",
    "sellTokenAddress": "address of the token that will be sold",
    "buyTokenAddress": "address of token that will be bought",
    "sellTokenAmount": "amount of token that will be sold",
    "slippage": "amount of slippage that is being accepted;",
    "skipValidation": "whether txn hex data needs to be returned. It should be false if you want txn data ready for execution" 
}
```


  - Response - example: 
```javascript
{
    "estimatedGas": "282266",
    "buyTokenAddress": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "buyAmount": "25566403521115626888",
    "sellTokenAddress": "0x14af1f2f02dccb1e43402339099a05a5e363b83c",
    "sellAmount": "631516806119675496697",
    "allowanceTarget": "0x6afD834f6e3D5ad5A83E7838ca45F3DBDe3E323d"
}
```

- GET `/v1.0/{chainId}/getQuote` - Fetches the best aggregated quotes for given trading pair. The transaction is validated & yields txn hex data which is ready to be executed. Supported chains are Ethereum mainnet, Arbitrum, Optimism, Polygon, Base.
  - Request - example: 
  https://api.metadexa.io/v1.0/137/getQuote?fromAddress=0x3510D70e9fFcF31C2Cb7c000CD65B0Ff2272CE66&sellTokenAddress=0x14Af1F2f02DCcB1e43402339099A05a5E363b83c&buyTokenAddress=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&sellTokenAmount=1263033612239350993394&slippage=0.005&skipValidation=false
  
  - Request: query parameters
```javascript
{
    "fromAddress": "address of txn executor",
    "sellTokenAddress": "address of the token that will be sold",
    "buyTokenAddress": "address of token that will be bought",
    "sellTokenAmount": "amount of token that will be sold",
    "slippage": "amount of slippage that is being accepted;",
    "skipValidation": "whether txn hex data needs to be returned. It should be false if you want txn data ready for execution" 
}
```

  - Response - example: 
```javascript
{
    "estimatedGas": "282868",
    "buyTokenAddress": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "buyAmount": "51049307237772843939",
    "sellTokenAddress": "0x14af1f2f02dccb1e43402339099a05a5e363b83c",
    "sellAmount": "1263033612239350993394",
    "allowanceTarget": "0x6afD834f6e3D5ad5A83E7838ca45F3DBDe3E323d",
    "tx": {
        "from": "0x3510D70e9fFcF31C2Cb7c000CD65B0Ff2272CE66",
        "to": "0x6afD834f6e3D5ad5A83E7838ca45F3DBDe3E323d",
        "data": "0xe79f303b00000000000000000000000014af1f2f02dccb1e43402339099a05a5e363b83c000000000000000000000000000000000000000000000044781cca7e28fb11f2000000000000000000000",
        "gas": 429014,
        "value": "0",
        "gasPrice": "30000000013"
    }
}
```

- GET `/v1.0/{chainId}/getGaslessQuote` - Fetches the best Gasless aggregated quotes for given trading pair. The transaction is not validated, which means it is not ready for execution.
  - Request - example: 

https://api.metadexa.io/v1.0/137/getGaslessQuote?fromAddress=0x3510D70e9fFcF31C2Cb7c000CD65B0Ff2272CE66&sellTokenAddress=0x14Af1F2f02DCcB1e43402339099A05a5E363b83c&buyTokenAddress=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&sellTokenAmount=631516806119675496697&slippage=0.005&skipValidation=true

  - Request: query parameters
```javascript
{
    "fromAddress": "address of txn executor",
    "sellTokenAddress": "address of the token that will be sold",
    "buyTokenAddress": "address of token that will be bought",
    "sellTokenAmount": "amount of token that will be sold",
    "slippage": "amount of slippage that is being accepted;",
    "skipValidation": "whether txn hex data needs to be returned. It should be false if you want txn data ready for execution" 
}
```
  - Response - example: 
```javascript
 {
    "estimatedGas": "282266",
    "paymentTokenAddress": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "paymentFees": "0",
    "buyTokenAddress": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "buyAmount": "25566403521115626888",
    "sellTokenAddress": "0x14af1f2f02dccb1e43402339099a05a5e363b83c",
    "sellAmount": "631516806119675496697",
    "allowanceTarget": "0x6afD834f6e3D5ad5A83E7838ca45F3DBDe3E323d"
}
```

- GET `/v1.0/{chainId}/getGaslessQuote` - Fetches the best Gasless aggregated quotes for given trading pair & yields txn hex data which is ready to be executed
  - Request - example: 
https://api.metadexa.io/v1.0/137/getGaslessQuote?fromAddress=0x3510D70e9fFcF31C2Cb7c000CD65B0Ff2272CE66&sellTokenAddress=0x14Af1F2f02DCcB1e43402339099A05a5E363b83c&buyTokenAddress=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&sellTokenAmount=1263033612239350993394&slippage=0.005&skipValidation=false

  - Request: query parameters
```javascript
{
    "fromAddress": "address of txn executor",
    "sellTokenAddress": "address of the token that will be sold",
    "buyTokenAddress": "address of token that will be bought",
    "sellTokenAmount": "amount of token that will be sold",
    "slippage": "amount of slippage that is being accepted;",
    "skipValidation": "whether txn hex data needs to be returned. It should be false if you want txn data ready for execution" 
}
```
  - Response - example: 
```javascript
{
    "estimatedGas": "282868",
    "paymentTokenAddress": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "paymentFees": "0",
    "buyTokenAddress": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "buyAmount": "51049307237772843939",
    "sellTokenAddress": "0x14af1f2f02dccb1e43402339099a05a5e363b83c",
    "sellAmount": "1263033612239350993394",
    "allowanceTarget": "0x6afD834f6e3D5ad5A83E7838ca45F3DBDe3E323d",
    "tx": {
        "from": "0x3510D70e9fFcF31C2Cb7c000CD65B0Ff2272CE66",
        "to": "0x316766609569e00c3484fE9e558A35b975064a62",
        "data": "0xf08a8de400000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000c2000000000000000000000",
        "gas": 487632,
        "value": "0",
        "gasPrice": "30000000014"
    }
}
```

## Swagger Documentation
https://api.metadexa.io

## Contributing 
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.


## License 
[MIT License](https://choosealicense.com/licenses/mit/)
