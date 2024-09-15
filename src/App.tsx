import { useState } from 'react';
import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading, Tabs } from "@radix-ui/themes";
// import { WalletStatus } from "./WalletStatus";
import { BlobUploader } from "./BlobUploader";
import { QueryComponent } from "./QueryComponent"; 

function App() {
  const [activeTab, setActiveTab] = useState('query'); // 将默认值改为 'query'

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>Vehicle LifeTime</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container className="w-full">
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500}}
        >
          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Trigger value="query">查询</Tabs.Trigger>
              <Tabs.Trigger value="upload">上传</Tabs.Trigger>
            </Tabs.List>
            <Box pt="4">
              {activeTab === 'query' ? (
                <QueryComponent />
              ) : (
                <BlobUploader />
              )}
              {/* <WalletStatus /> */}
            </Box>
          </Tabs.Root>
        </Container>
      </Container>
    </>
  );
}

export default App;
