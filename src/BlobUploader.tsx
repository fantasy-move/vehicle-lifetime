//@ts-nocheck
import React, { useState, FormEvent, useEffect } from 'react';
import { PUBLISHER_URL, AGGREGATOR_URL, SUI_NETWORK, SUI_VIEW_TX_URL, SUI_VIEW_OBJECT_URL } from './config';
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, getTransactionBlock } from "@mysten/dapp-kit";
import { pkgId, globelId } from "./sui-contract/constrant";
// import { suiClient } from "./sui-contract/sui-client";
// 

// 定义一个接口来描述单个车辆记录的结构
interface VehicleRecord {
    vin: string;
    objectId: string;
}

// 定义一个类来管理车辆记录
class VehicleRegistry {
    private records: VehicleRecord[] = [];

    // 添加新记录
    addRecord(vin: string, objectId: string) {
        this.records.push({ vin, objectId });
    }

    // 根据 VIN 查找记录
    findByVin(vin: string): VehicleRecord | undefined {
        return this.records.find(record => record.vin === vin);
    }

    // 将记录转换为 JSON 字符串
    toJSON(): string {
        return JSON.stringify(this.records);
    }

    // 从 JSON 字符串加载记录
    fromJSON(json: string) {
        this.records = JSON.parse(json);
    }

    // 获取所有记录
    getAllRecords(): VehicleRecord[] {
        return this.records;
    }
}

export function BlobUploader() {
    const [file, setFile] = useState<File | null>(null);
    const [numEpochs, setNumEpochs] = useState<number>(1);
    const [publisherUrl, setPublisherUrl] = useState<string>(PUBLISHER_URL);
    const [aggregatorUrl, setAggregatorUrl] = useState<string>(AGGREGATOR_URL);
    const [uploadedBlobs, setUploadedBlobs] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [make, setMake] = useState<string>('');
    const [model, setModel] = useState<string>('');
    const [year, setYear] = useState<string>('');
    const [color, setColor] = useState<string>('');
    const [vin, setVin] = useState<string>('');
    const [vinSub, setVinSub] = useState<string>('');
    const [carInfo, setCarInfo] = useState<any[]>([]);
    const [isCarInfoSubmitted, setIsCarInfoSubmitted] = useState<boolean>(false);
    const [globalObject, setGlobalObject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [blobId, setBlobId] = useState<string | null>(null);
    const [isSubmittingCarInfo, setIsSubmittingCarInfo] = useState<boolean>(false);
    const [parsedCarInfo, setParsedCarInfo] = useState<any>(null);
    const [combinedCarInfo, setCombinedCarInfo] = useState<any>(null);
    const [carInfoBlobId, setCarInfoBlobId] = useState<string | null>(null);
    const [combinedBlobId, setCombinedBlobId] = useState<string | null>(null);
    const [digest, setDigest] = useState<string | null>(null);
    const [registry] = useState(() => new VehicleRegistry());
    const suiClient = useSuiClient(); 
    const account = useCurrentAccount();
    const sender = account?.address;
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [isCombining, setIsCombining] = useState<boolean>(false);
    //   const { mutate: getTransactionBlock } = getTransactionBlock();
   
    const fetchGlobalObject = async () => {
        let globalinfo = new Map();
        try {
          const result = await suiClient.getObject({
            id: globelId,
            options: {
              showContent: true,
              showOwner: true,
              showDisplay: true,
            },
          });
          console.log(result)
          // setGlobalObject(result);
          // Extract blob_id from the result
          const blobId = result.data?.content?.fields?.blob_id;
    
          if (blobId) {
            console.log(blobId)
            
            try {
              globalinfo = await fetchBlobInfoById(blobId);
            //   console.log("Global info:", mapToJson(globalinfo));
              // You can do something with globalinfo here if needed
            } catch (blobError) {
              console.error('Error fetching blob info:', blobError);
              setError('Failed to fetch blob information');
              globalinfo = new Map();
            }
          }
          // setIsLoading(false);
        } catch (err) {
          console.error('Error fetching global object:', err);
          setError('Failed to fetch global object');
          // setIsLoading(false);
        }
        console.log(globalinfo)
        return globalinfo;
    };

    // 辅助函数
    function mapToJson(map) {
        return JSON.stringify([...map]);
    }

    function jsonToMap(jsonStr) {
        return new Map(JSON.parse(jsonStr));
    }

    useEffect(()=>{
        fetchGlobalObject();
    },[])
   
    const storeBlob = async (): Promise<{ info: any, media_type: string }> => {
        if (!file) throw new Error("No file selected");

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${publisherUrl}/v1/store?epochs=${numEpochs}`, {
            method: "PUT",
            body: file,
        });

        if (response.status === 200) {
            const info = await response.json();
            console.log(info);
            return { info, media_type: file.type };
        } else {
            throw new Error("Something went wrong when storing the blob!");
        }
    };

    const storeCarInfoBlob = async (carInfo: any): Promise<{ info: any, media_type: string }> => {
        const jsonBlob = new Blob([JSON.stringify(carInfo)], { type: 'application/json' });
        const file = new File([jsonBlob], 'car_info.json', { type: 'application/json' });

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        const response = await fetch(`${publisherUrl}/v1/store?epochs=${numEpochs}`, {
            method: "PUT",
            body: dataTransfer.files[0],
        });

        if (response.status === 200) {
            const info = await response.json();
            console.log(info);
            return { info, media_type: file.type };
        } else {
            throw new Error("Something went wrong when storing the car info blob!");
        }
    };

    const displayUpload = (storage_info: any, media_type: string) => {
        let info: any;
        console.log(storage_info, media_type);
        if ("alreadyCertified" in storage_info) {
            info = {
                status: "Already certified",
                blobId: storage_info.alreadyCertified.blobId,
                endEpoch: storage_info.alreadyCertified.endEpoch,
                suiRefType: "Previous Sui Certified Event",
                suiRef: storage_info.alreadyCertified.event.txDigest,
                suiBaseUrl: SUI_VIEW_TX_URL,
            };
        } else if ("newlyCreated" in storage_info) {
            info = {
                status: "Newly created",
                blobId: storage_info.newlyCreated.blobObject.blobId,
                endEpoch: storage_info.newlyCreated.blobObject.storage.endEpoch,
                suiRefType: "Associated Sui Object",
                suiRef: storage_info.newlyCreated.blobObject.id,
                suiBaseUrl: SUI_VIEW_OBJECT_URL,
            };
        } else {
            throw Error("Unhandled successful response!");
        }

        const blobUrl = `${aggregatorUrl}/v1/${info.blobId}`;
        const suiUrl = `${info.suiBaseUrl}/${info.suiRef}`;
        console.log(blobUrl);
        setUploadedBlobs(prevBlobs => [...prevBlobs, {
            ...info,
            blobUrl,
            suiUrl,
            media_type,
            content: null
        }]);

        if (media_type === 'application/json') {
            fetch(blobUrl)
                .then(response => response.json())
                .then(data => {
                    setUploadedBlobs(prevBlobs => prevBlobs.map(blob =>
                        blob.blobId === info.blobId ? { ...blob, content: JSON.stringify(data, null, 2) } : blob
                    ));
                })
                .catch(error => {
                    console.error('Error fetching JSON:', error);
                    setUploadedBlobs(prevBlobs => prevBlobs.map(blob =>
                        blob.blobId === info.blobId ? { ...blob, content: 'Error loading JSON' } : blob
                    ));
                });
        }
    };

    const onSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setIsUploading(true);
        setAlertMessage(null);

        try {
            if (file) {
                const storageInfo = await storeBlob();
                console.log(storageInfo);
                displayUpload(storageInfo.info, storageInfo.media_type);
            }
        } catch (error) {
            console.error(error);
            setAlertMessage("An error occurred while uploading. Check the browser console and ensure that the aggregator and publisher URLs are correct.");
        } finally {
            setIsUploading(false);
        }
    };

    const submitCarInfo = async (event: FormEvent) => {
        event.preventDefault();
        setIsSubmittingCarInfo(true);
        const newCarInfo = { make, model, year, color, vin };

        try {
            const storageInfo = await storeCarInfoBlob(newCarInfo);

            const blobId = storageInfo.info.newlyCreated?.blobObject.blobId || storageInfo.info.alreadyCertified?.blobId;
            setCarInfoBlobId(blobId);

            setCarInfo(prevInfo => [{
                ...newCarInfo,
                blobId
            }, ...prevInfo]);

            setParsedCarInfo(newCarInfo);
            setVinSub(vin)
            setIsCarInfoSubmitted(true);
        } catch (error) {
            console.error(error);
            setAlertMessage("An error occurred while submitting car information.");
        } finally {
            setIsSubmittingCarInfo(false);
        }
    };
    const fetchBlobInfo = async (digest: string|null): Promise<boolean> => {
        if(!digest){
            return false;
        }
        try {
            const result = await suiClient.getTransactionBlock({
                digest,
                options: {
                    showBalanceChanges: true,
                    showEffects: true,
                    showEvents: true,
                    showInput: true,
                    showObjectChanges: true,
                    showRawEffects: true,
                    showRawInput: true
                }
            });
        
            const vehicleObject = result.objectChanges?.find(change =>
                change.objectType.endsWith('vehicle::Vehicle')
            );
        
            if (vehicleObject) {
                console.log("Vehicle Object ID:", vehicleObject.objectId);
                try {
                    // 获取当前的 globalObject
                    let globalObject = await fetchGlobalObject();
                    let objectId = vehicleObject.objectId;
                    // 添加新的 VIN 和 Object ID
                    globalObject.set(vinSub, objectId);
            
                    // 将更新后的 globalObject 转换为 JSON 字符串
                    const updatedGlobalJson = JSON.stringify(Object.fromEntries(globalObject));
            
                    // 创建新的 Blob
                    const jsonBlob = new Blob([updatedGlobalJson], { type: 'application/json' });
                    const file = new File([jsonBlob], 'updated_global_object.json', { type: 'application/json' });
            
                    // 上传到 Blob 存储
                    const response = await fetch(`${publisherUrl}/v1/store?epochs=${numEpochs}`, {
                        method: "PUT",
                        body: file,
                    });
            
                    if (response.status === 200) {
                        const info = await response.json();
                        console.log("Updated global object stored:", info);
            
                        // 获取新的 blob ID
                        const newBlobId = info.newlyCreated?.blobObject.blobId || info.alreadyCertified?.blobId;
                        console.log(" global new blodId, ", newBlobId)
                        if (newBlobId) {
                            // 使用新的 blob ID 更新 Sui 上的全局对象
                            await updateGlobalObjectOnSui(newBlobId);
                        } else {
                            throw new Error("Failed to get new blob ID");
                        }
                    } else {
                        throw new Error("Failed to store updated global object");
                    }
                } catch (error) {
                    console.error('Error in addVehicleToGlobal:', error);
                    setError(`Error in addVehicleToGlobal: ${error.message}`);
                }

                return true; // Successfully processed
            } else {
                console.log("No vehicle object found in the transaction");
                return false; // Need to continue polling
            }
        } catch (error) {
            console.error("Error fetching transaction data:", error);
            if (error instanceof Error) {
                setError(`Failed to fetch transaction data: ${error.message}`);
            } else {
                setError("An unknown error occurred while fetching transaction data");
            }
            return false; // Error occurred, may need to continue polling
        }
    }
    // useEffect(() => {
    //     fetchBlobInfo(digest)
    // }, [digest]);

    const updateGlobalObjectOnSui = async (newBlobId: string) => {
        if (!sender) {
            console.error('No account connected');
            return;
        }
    
        console.log("Updating global object with new blobId:", newBlobId);
    
        const txb = new Transaction();
        txb.setSender(sender);
        const moduleName = 'global'; // 合约模块名
        const funcName = 'set_blob';
    
        try {
            txb.moveCall({
                target: `${pkgId}::${moduleName}::${funcName}`,
                arguments: [txb.object(globelId), txb.pure.string(newBlobId)]
            });
    
            txb.setGasBudget(1000000000);
    
            signAndExecuteTransaction({
                transaction: txb,
            }, {
                onSuccess: (result) => {
                    console.log('Global object updated successfully', result);
                    // You might want to update some state here to reflect the change
                    setAlertMessage("Global object updated successfully");
                },
                onError: (error) => {
                    console.error('Failed to update global object', error);
                    setError(`Failed to update global object: ${error.message}`);
                },
                onSettled: () => {
                    console.log('Update global object transaction settled');
                }
            });
        } catch (error: any) {
            console.error('Error in updateGlobalObjectOnSui:', error);
            setError(`Error in updateGlobalObjectOnSui: ${error.message}`);
        }
    };
    const addVehicleToGlobal = async (objectId: String) => {
        if (!sender) {
            console.error('No account connected');
            return;
        }
        console.log("Creating vehicle with blobId:", blobId);

        const txb = new Transaction();
        txb.setSender(sender);
        const moduleName = 'store';
        const funcName = 'create_vehicle';

        try {
            txb.moveCall({
                target: `${pkgId}::${moduleName}::${funcName}`,
                arguments: [txb.object(globelId), txb.pure.string(vinSub), txb.pure.string(blobId)]
            });

            txb.setGasBudget(1000000000);

            signAndExecuteTransaction({
                transaction: txb,
            }, {
                onSuccess: async (res) => {
                    console.log('Transaction submitted successfully', res);
                    const digest = res.digest;
                    setDigest(digest);

                    // Start polling for transaction status
                    pollTransactionStatus(digest);
                },
                onError(error) {
                    console.error('Transaction failed', error);
                    setError(`Transaction failed: ${error.message}`);
                },
                onSettled() {
                    console.log('Transaction settled');
                }
            });
        } catch (error: any) {
            console.error('Error in createVehicleOnSui:', error);
            setError(`Error in createVehicleOnSui: ${error.message}`);
        }
    };

    const createVehicleOnSui = async (blobId: String) => {
        if (!sender) {
            console.error('No account connected');
            return;
        }
        console.log("Creating vehicle with blobId:", blobId);

        const txb = new Transaction();
        txb.setSender(sender);
        const moduleName = 'store';
        const funcName = 'create_vehicle';

        try {
            txb.moveCall({
                target: `${pkgId}::${moduleName}::${funcName}`,
                arguments: [txb.object(globelId), txb.pure.string(vinSub), txb.pure.string(blobId)]
            });

            txb.setGasBudget(1000000000);

            signAndExecuteTransaction({
                transaction: txb,
            }, {
                onSuccess: async (res) => {
                    console.log('Transaction submitted successfully', res);
                    const digest = res.digest;
                    setDigest(digest);

                    // Start polling for transaction status
                    pollTransactionStatus(digest);
                },
                onError(error) {
                    console.error('Transaction failed', error);
                    setError(`Transaction failed: ${error.message}`);
                },
                onSettled() {
                    console.log('Transaction settled');
                }
            });
        } catch (error: any) {
            console.error('Error in createVehicleOnSui:', error);
            setError(`Error in createVehicleOnSui: ${error.message}`);
        }
    };

    const pollTransactionStatus = async (digest: string) => {
        let attempts = 0;
        const maxAttempts = 10;
        const pollInterval = 3000; // 3 seconds
        setTimeout( async() => {
            const status = await suiClient.getTransactionBlock({ digest });
                if (status) {
                    // Transaction is processed, fetch blob info
                    const success = await fetchBlobInfo(digest);
                   
                }
        }, 5000);

        // const poll = async () => {
        //     if (attempts >= maxAttempts) {
        //         setError("Transaction processing timed out. Please check manually.");
        //         return;
        //     }

        //     try {
        //         const status = await suiClient.getTransactionBlock({ digest });
        //         if (status) {
        //             // Transaction is processed, fetch blob info
        //             const success = await fetchBlobInfo(digest);
        //             if (success) {
        //                 // If blob info was successfully fetched, stop polling
        //                 return;
        //             }
        //         }
        //         // If transaction is not processed or blob info fetch failed, continue polling
        //         attempts++;
        //         setTimeout(poll, pollInterval);
        //     } catch (error) {
        //         console.error('Error polling transaction status:', error);
        //         setError(`Failed to poll transaction status: ${error.message}`);
        //     }
        // };

        // poll();
    };

    const handleCombineAndSubmit = async () => {
        if (!carInfoBlobId) {
            setAlertMessage("Car information has not been submitted yet.");
            return;
        }

        const combined = {
            baseInfo: carInfoBlobId,
            files: uploadedBlobs.map(blob => ({
                type: blob.media_type,
                blobId: blob.blobId
            }))
        };

        try {
            setIsCombining(true);
            const storageInfo = await storeCarInfoBlob(combined);

            const newBlobId = storageInfo.info.newlyCreated?.blobObject.blobId || storageInfo.info.alreadyCertified?.blobId;
            setCombinedBlobId(newBlobId);

            const updatedCombined = {
                ...combined,
                combinedBlobId: newBlobId
            };

            setCombinedCarInfo(updatedCombined);
            setParsedCarInfo(updatedCombined);

            // Display the newly created blob
            displayUpload(storageInfo.info, 'application/json');
            console.log("124353")
            createVehicleOnSui(newBlobId);
        } catch (error) {
            console.error(error);
            setAlertMessage("An error occurred while combining and submitting information.");
        } finally {
            setIsCombining(false);
        }
    };

    const renderParsedCarInfo = () => {
        if (!parsedCarInfo) return null;
        return (
            <div className="mb-8 p-4 border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">Car BaseInformation</h3>
                <div className="space-y-2">
                    <p><strong>VIN:</strong> {parsedCarInfo.vin}</p>
                    <p><strong>Make:</strong> {parsedCarInfo.make}</p>
                    <p><strong>Model:</strong> {parsedCarInfo.model}</p>
                    <p><strong>Year:</strong> {parsedCarInfo.year}</p>
                    <p><strong>Color:</strong> {parsedCarInfo.color}</p>
                    {/* {parsedCarInfo.combinedBlobId && (
                        <p><strong>Combined Blob ID:</strong> {parsedCarInfo.combinedBlobId}</p>
                    )} */}
                </div>
            </div>
        );
    };

    const handleDelete = (blobId: string) => {
        setUploadedBlobs(prevBlobs => prevBlobs.filter(blob => blob.blobId !== blobId));
    };

    // 添加记录的函数
    const addVehicleRecord = (vin: string, objectId: string) => {
        registry.addRecord(vin, objectId);
        // 可以在这里将更新后的记录保存到本地存储或发送到服务器
        localStorage.setItem('vehicleRegistry', registry.toJSON());
    };

    // 从本地存储加载记录的函数
    const loadVehicleRecords = () => {
        const savedRegistry = localStorage.getItem('vehicleRegistry');
        if (savedRegistry) {
            registry.fromJSON(savedRegistry);
        }
    };



    // 在需要显示记录的地方
    const renderVehicleRecords = () => {
        return (
            <div>
                <h3>Vehicle Records</h3>
                <ul>
                    {registry.getAllRecords().map((record, index) => (
                        <li key={index}>
                            VIN: {record.vin}, Object ID: {record.objectId}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const fetchBlobInfoById = async (blobId: string): Promise<Map<string, any>> => {
        try {
            const response = await fetch(`${aggregatorUrl}/v1/${blobId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Convert the JSON object to a Map
            const blobInfo = new Map<string, string>();
            for (const [key, value] of Object.entries(data)) {
                blobInfo.set(key, value);
            }
            
            return blobInfo;
        } catch (error) {
            console.error('Error fetching blob info:', error);
            return new Map<string, string>()
        }
    };

    return (
        <div className="container mx-auto px-2 py-4 max-w-5xl">
            <header className="mb-4">
                <h1 className="text-2xl font-bold mb-1">Vehicle Blob Upload</h1>
                {/* <p className="text-lg text-gray-600">An example uploading and displaying files with Walrus.</p> */}
            </header>
            <main className="flex flex-col md:flex-row gap-4">
                {/* Left Column - Submission Forms */}
                <div className="w-full md:w-1/2">
                    {/* Car Info Form */}
                    <form onSubmit={submitCarInfo} className="mb-4">
                        <h2 className="text-xl font-semibold mb-2">Car Base Information</h2>
                        <div className="space-y-2">
                            <div>
                                <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    id="vin"
                                    value={vin}
                                    onChange={(e) => setVin(e.target.value)}
                                    maxLength={17}
                                    pattern="^[A-HJ-NPR-Z0-9]{17}$"
                                    title="Please enter a valid 17-character VIN"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    id="make"
                                    value={make}
                                    onChange={(e) => setMake(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    id="model"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    id="year"
                                    value={year}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setYear(value);
                                    }}
                                    pattern="\d{4}"
                                    maxLength={4}
                                    title="Please enter a valid 4-digit year"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    id="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="mt-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            disabled={isSubmittingCarInfo}
                        >
                            {
                                isSubmittingCarInfo ? 'Submitting Car Info...' : 'Submit Car Info'}
                        </button>
                    </form>

                    {/* File Upload Form */}
                    <form onSubmit={onSubmit}>
                        <h2 className="text-xl font-semibold mb-2">Upload File</h2>
                        <div className="mb-2">
                            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">File to upload</label>
                            <input
                                type="file"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                id="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                required
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                disabled={!file || isUploading || !isCarInfoSubmitted}
                                title={!isCarInfoSubmitted ? "Please submit car information first" : ""}
                            >
                                {isUploading ? 'Uploading...' : 'Upload File'}
                            </button>
                            {!isCarInfoSubmitted && (
                                <p className="mt-2 text-sm text-red-600">Please submit car information before uploading files.</p>
                            )}
                        </div>
                    </form>
                    <button
                        onClick={handleCombineAndSubmit}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        disabled={uploadedBlobs.length === 0 || !carInfoBlobId || isCombining}
                    >
                        {isCombining ? 'Combining and Submitting...' : 'Combine and Submit'}
                    </button>
                </div>

                {/* Right Column - Parsed Car Info and Uploaded Content */}
                <div className="w-full md:w-1/2 h-[calc(100vh-8rem)] overflow-y-auto pr-2">
                    {/* Render parsed car info at the top of the right column */}
                    {renderParsedCarInfo()}

                    <section>
                        <h2 className="text-xl font-semibold mb-2">Uploaded vehicle Info</h2>
                        <div id="uploaded-blobs" className="space-y-2">
                            {uploadedBlobs.map((blob, index) => (
                                <article key={index} className="border rounded-lg shadow-sm p-2">
                                    {/* Upper part - Blob ID and Delete button */}
                                    <div className="mb-2 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-semibold">Blob ID:</h3>
                                            <a href={blob.blobUrl} className="text-blue-600 hover:underline">{blob.blobId}</a>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(blob.blobId)}
                                            className="px-2 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            Delete
                                        </button>
                                    </div>

                                    {/* Lower part - Content */}
                                    <div>
                                        {blob.media_type.startsWith('image') ? (
                                            <img src={blob.blobUrl} className="w-full h-auto object-cover rounded" alt="Uploaded image" />
                                        ) : blob.media_type.startsWith('video') ? (
                                            <video src={blob.blobUrl} className="w-full h-auto rounded" controls>
                                                Your browser does not support the video tag.
                                            </video>
                                        ) : blob.media_type.startsWith('audio') ? (
                                            <audio src={blob.blobUrl} className="w-full" controls>
                                                Your browser does not support the audio tag.
                                            </audio>
                                        ) : blob.media_type === 'application/json' ? (
                                            <pre className="w-full h-64 overflow-auto bg-gray-100 p-2 rounded">
                                                <code>{blob.content || 'Loading JSON...'}</code>
                                            </pre>
                                        ) : (
                                            <object data={blob.blobUrl} type={blob.media_type} className="w-full h-64 rounded">
                                                <p>Unable to display file. <a href={blob.blobUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Download instead</a>.</p>
                                            </object>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>

                    </section>
                </div>
            </main>
            
        </div>
    );
}