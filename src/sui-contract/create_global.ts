import { TransactionBlock } from '@mysten/sui.js/transactions';
import { suiClient, signer } from './sui-elements';
import { pkgId } from './constrant';

async function customContractTransaction() {

  /** 输入合约调用相关信息 **/
//   const pkgId = '0x2ca648213ec26b9447ca8018661362c603ebf30255e647c9e14dbacf9c6df32f'; // 合约包ID
  const moduleName = 'global'; // 合约模块名
  const funcName = 'create_pool'; // 方法名

  /** 参与交易的Objects **/
//   const globelId = '0xe023c588f24b0b268ca2013beb1f8dce610843309e3aafc025e86314363a6efb';
  // const vehicleId = 'aodi_a6_allrod4';
  const blod_id = 'w6NcMXKeIlahwKFIfR0GFMiX8l87lKTOyRE8-Cx9oKA1';
  const objectid = '0x5c470d2bce456cfbcd153e8571fa3d12c74665e3718a35a7d9dba648abf97a68';
  /** 组织交易数据 **/
  const tx = new TransactionBlock();
  // const target = `${pkgId}::${moduleName}::${funcName}`;
  tx.moveCall({
    target: `${pkgId}::${moduleName}::${funcName}`,
    arguments: [ tx.pure.string(blod_id), tx.pure.id(objectid)]
  });
  const address = signer.toSuiAddress();
  console.log(address);
  tx.setGasBudget(100000000)
  /** 发起交易 **/
  const result = await suiClient.signAndExecuteTransactionBlock({
    signer,
    transactionBlock: tx,
  });
  return result;
}

customContractTransaction().then(console.log).catch(console.error);

