//@ts-nocheck

import  { useState } from 'react';
import { AGGREGATOR_URL, SUI_VIEW_OBJECT_URL } from './config';
import { useSuiClient } from "@mysten/dapp-kit";
import { globelId } from "./sui-contract/constrant";
interface BlobInfo {
  blobId: string;
  blobUrl: string;
  suiUrl: string;
  media_type: string;
  content: any;
  status: string;
  endEpoch: number;
  suiRefType: string;
  suiRef: string;
}

interface FileInfo {
  type: string;
  blobId: string;
  content: any;
}

interface ParsedCarInfo {
  baseInfo: BlobInfo | null;
  files: FileInfo[];
}





export function QueryComponent() {

  const suiClient = useSuiClient();
  const [vin, setVin] = useState<string>('');
  const [carInfo, setCarInfo] = useState<BlobInfo | null>(null);
  const [parsedCarInfo, setParsedCarInfo] = useState<ParsedCarInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlobInfo = async (id: string): Promise<BlobInfo> => {

    const response = await fetch(`${AGGREGATOR_URL}/v1/${id}`);
    console.log("Response:", response);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob information for ID: ${id}`);
    }
    const data = await response.json();
    console.log(data)
    return {
      blobId: id,
      blobUrl: `${AGGREGATOR_URL}/v1/${id}`,
      suiUrl: `${SUI_VIEW_OBJECT_URL}/${id}`,
      media_type: response.headers.get('Content-Type') || 'application/json',
      content: data,
      status: 'Fetched',
      endEpoch: 0,
      suiRefType: 'Associated Sui Object',
      suiRef: id,
    };
  };
  const fetchGlobalObject = async () => {
    var globalinfo = {}
    try {
      console.log(globelId)
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
          const response = await fetch(`${AGGREGATOR_URL}/v1/${blobId}`);
          console.log("Response:", response);
          if (!response.ok) {
            throw new Error(`Failed to fetch blob information for ID: ${blobId}`);
          }
          const data = await response.json();
          console.log(data)
          globalinfo = data;
          console.log("Global info:", globalinfo);
          // You can do something with globalinfo here if needed
        } catch (blobError) {
          console.error('Error fetching blob info:', blobError);
          setError('Failed to fetch blob information');
          globalinfo = {}
        }
      }
      // setIsLoading(false);
    } catch (err) {
      console.error('Error fetching global object:', err);
      setError('Failed to fetch global object');
      // setIsLoading(false);
    }
    return globalinfo;
  };

  // useEffect(()=>{
  //   fetchGlobalObject();
  // },[])

  const fetchCarInfo = async () => {
    if (!vin) {
      setError('Please enter a VIN');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCarInfo(null);
    setParsedCarInfo(null);

    try {
      const globalInfo = await fetchGlobalObject();
      if (globalInfo && typeof globalInfo === 'object') {
        const vehicleObjectId = globalInfo[vin];
        if (vehicleObjectId) {

          
            const result = await suiClient.getObject({
              id: vehicleObjectId,
              options: {
                showContent: true,
                showOwner: true,
                showDisplay: true,
              },
            });
        
            if (!result.data) {
              throw new Error(`Failed to fetch Sui object for ID: ${id}`);
            }
        
            const content = result.data.content;
            const blobId = content?.fields?.blob_id;
          const blobInfo = await fetchBlobInfo(blobId);
          setCarInfo(blobInfo);
          console.log("Main blob info:", blobInfo);
          const parsedInfo: ParsedCarInfo = {
            baseInfo: null,
            files: [],
          };

          if (typeof blobInfo.content === 'object' && blobInfo.content !== null) {
            if ('baseInfo' in blobInfo.content) {
              parsedInfo.baseInfo = await fetchBlobInfo(blobInfo.content.baseInfo);
            }
            if ('files' in blobInfo.content && Array.isArray(blobInfo.content.files)) {
              parsedInfo.files = blobInfo.content.files;
            }
            console.log("Final parsed info:", parsedInfo);
          }

          setParsedCarInfo(parsedInfo);
        } else {
          setError('Vehicle not found for the given VIN');
        }
      } else {
        setError('Invalid global object structure');
      }
    } catch (err) {
      setError('Error fetching car information. Please check the VIN and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  function renderContent(content: any) {
    if (typeof content !== 'object' || content === null) {
      return <p className="text-gray-700">{String(content)}</p>;
    }

    return (
      <ul className="space-y-2">
        {Object.entries(content).map(([key, value]) => (
          <li key={key} className="bg-gray-50 p-2 rounded-md">
            <span className="font-semibold text-indigo-600">{key}:</span>{' '}
            {typeof value === 'object' && value !== null ? (
              <div className="ml-4 mt-1">
                {renderContent(value)}
              </div>
            ) : (
              <span className="text-gray-700">{String(value)}</span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  const renderBlobInfo = (info: BlobInfo) => (
    <article className="border rounded-lg shadow-sm p-4 mt-4">
      <div className="mb-2 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Blob ID:</h3>
          <a href={info.blobUrl} className="text-blue-600 hover:underline">{info.blobId}</a>
        </div>
        <div>
          <p><strong>Status:</strong> {info.status}</p>
          <p><strong>End Epoch:</strong> {info.endEpoch}</p>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-lg font-semibold mb-2 text-gray-800">Content:</h4>
        <div className="bg-white shadow-sm rounded-lg p-4 overflow-auto max-h-96">
          {renderContent(info.content)}
        </div>
      </div>
    </article>
  );

  const renderFileInfo = (file: FileInfo) => (
    <article key={file.blobId} className="border rounded-lg shadow-sm p-4 mt-4">
      <div className="mb-2 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Blob ID:</h3>
          <a href={`${AGGREGATOR_URL}/v1/${file.blobId}`} className="text-blue-600 hover:underline">{file.blobId}</a>
        </div>
        <p><strong>Type:</strong> {file.type}</p>
      </div>

      <div>
        {file.type.startsWith('image') ? (
          <img src={`${AGGREGATOR_URL}/v1/${file.blobId}`} className="w-full h-auto object-cover rounded" alt="Uploaded image" />
        ) : file.type.startsWith('video') ? (
          <video src={`${AGGREGATOR_URL}/v1/${file.blobId}`} className="w-full h-auto rounded" controls>
            Your browser does not support the video tag.
          </video>
        ) : (
          <p>Unsupported file type: {file.type}</p>
        )}
      </div>
    </article>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Query Car Information</h2>
      <div className="mb-4">
        <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">Car VIN</label>
        <input
          type="text"
          id="vin"
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter the VIN"
        />
      </div>
      <button
        onClick={fetchCarInfo}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
      >
        {isLoading ? 'Fetching...' : 'Fetch Car Info'}
      </button>
      {error && (
        <p className="mt-2 text-red-600">{error}</p>
      )}
     
      {parsedCarInfo && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Parsed Car Information</h3>
          {parsedCarInfo.baseInfo && (
            <div>
              <h4 className="text-lg font-semibold mb-2">Base Information:</h4>
              {renderBlobInfo(parsedCarInfo.baseInfo)}
            </div>
          )}
          {parsedCarInfo.files.length > 0 && (
            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-2">Associated Files:</h4>
              {parsedCarInfo.files.map(renderFileInfo)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}