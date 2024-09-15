import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

// 初始化SUI Client, 用于和主网(mainnet)交互
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
// 从环境变量读取secretKey
// const secretKey = 'suiprivkey1qz8zyjcx0wp7gwytnffernv7u24hyxxskfhtv4exgmfu0afmp2szxrmpldv';

/** 这里把base64编码的secretKey转换为字节数组后截掉第一个元素，是因为第一位是一个私钥类型的标记位，后续派生签名者时不需要 **/

export { suiClient }
