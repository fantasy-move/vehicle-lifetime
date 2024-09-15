import { useSuiClient } from "@mysten/dapp-kit";


const suiClient = useSuiClient();

const digest = 'FmrX7CwnGcSRSb3z89NBTGabCZMd2pMj1xumkahPE9Z9'

const resuslt =await suiClient.getTransactionBlock({
    digest,
    /** options for specifying the content to be returned */
    options: {
        showBalanceChanges: true,
        /** Whether to show transaction effects. Default to be False */
        showEffects: true,
        /** Whether to show transaction events. Default to be False */
        showEvents: true,
        /** Whether to show transaction input data. Default to be False */
        showInput: true,
        /** Whether to show object_changes. Default to be False */
        showObjectChanges: true,
        /** Whether to show raw transaction effects. Default to be False */
        showRawEffects: true,
        /** Whether to show bcs-encoded transaction input data */
        showRawInput: true
    }
}

)

console.log(resuslt)