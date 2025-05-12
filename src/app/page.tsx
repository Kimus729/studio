
"use client";

import * as React from "react";
import { UploadCloud, Loader2, Copy, AlertCircle, FileText, FileJson, Search, X, Plus, Send, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function HashSwiftPage() {
  // States for HashSwift (SHA-256 calculator)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileHash, setFileHash] = React.useState<string | null>(null);
  const [isHashLoading, setIsHashLoading] = React.useState<boolean>(false);
  const [hashError, setHashError] = React.useState<string | null>(null);
  const { toast } = useToast();

  // States for NFT Collection Viewer
  const [collectionNameInput, setCollectionNameInput] = React.useState<string>("COLNUM01-0e2995");
  const [collectionData, setCollectionData] = React.useState<any | null>(null);
  const [isCollectionLoading, setIsCollectionLoading] = React.useState<boolean>(false);
  const [collectionError, setCollectionError] = React.useState<string | null>(null);

  // States for VM Query Executor
  const [scAddressInput, setScAddressInput] = React.useState<string>("erd1qqqqqqqqqqqqqpgqjnz905d0ltg622m8404wkar3myrmqjg2j5hq33g9q6");
  const [funcNameInput, setFuncNameInput] = React.useState<string>("getTokenNum");
  const [argsInputs, setArgsInputs] = React.useState<string[]>(["COLNUM01"]);
  const [vmQueryResponse, setVmQueryResponse] = React.useState<any | null>(null);
  const [isVmQueryLoading, setIsVmQueryLoading] = React.useState<boolean>(false);
  const [vmQueryError, setVmQueryError] = React.useState<string | null>(null);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setHashError(null);
      setFileHash(null);
      setIsHashLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        setFileHash(hashHex);
      } catch (err) {
        console.error("Error calculating hash:", err);
        setHashError("Failed to calculate hash. Please try again.");
        setFileHash(null);
      } finally {
        setIsHashLoading(false);
      }
    } else {
      setSelectedFile(null);
      setFileHash(null);
    }
  };

  const handleCopyHash = () => {
    if (fileHash) {
      navigator.clipboard.writeText(fileHash)
        .then(() => {
          toast({
            title: "Copied to clipboard!",
            description: "The SHA-256 hash has been copied.",
          });
        })
        .catch(err => {
          console.error("Failed to copy hash:", err);
          toast({
            variant: "destructive",
            title: "Copy failed",
            description: "Could not copy hash to clipboard.",
          });
        });
    }
  };

  const fetchCollectionData = async (name: string) => {
    if (!name.trim()) {
      setCollectionError("Collection name cannot be empty.");
      setCollectionData(null);
      return;
    }
    setIsCollectionLoading(true);
    setCollectionError(null);
    setCollectionData(null); 
    try {
      const response = await fetch(`https://devnet-api.multiversx.com/collections/${name.trim()}`);
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `HTTP error! status: ${response.status}. Response not in JSON format.` };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCollectionData(data);
    } catch (err: any) {
      console.error("Error fetching collection data:", err);
      setCollectionError(err.message || "Failed to fetch collection data. Please check the collection name and try again.");
      setCollectionData(null);
    } finally {
      setIsCollectionLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCollectionData("COLNUM01-0e2995");
  }, []);

  const handleFetchCollection = () => {
    fetchCollectionData(collectionNameInput);
  };

  const renderCollectionDataTable = (data: any) => {
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      return <p className="text-muted-foreground p-4 text-center">No data to display for this collection.</p>;
    }

    return (
      <Table className="bg-card">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px] sm:w-[300px] md:w-[350px] font-semibold text-foreground">Property</TableHead>
            <TableHead className="font-semibold text-foreground">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(data).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="font-medium align-top break-words">{key}</TableCell>
              <TableCell className="align-top break-words whitespace-pre-wrap">
                {key === 'roles' && Array.isArray(value) ? (
                  <div className="space-y-2">
                    {(value as any[]).map((role: any, index: number) => (
                      <div key={index} className="p-3 border rounded-md bg-background shadow-sm space-y-1">
                        {role.address && (
                          <p className="font-medium text-sm">
                            Address: <span className="font-normal block sm:inline break-all text-muted-foreground">{role.address}</span>
                          </p>
                        )}
                        <p className="font-medium text-sm pt-1">Permissions:</p>
                        <ul className="list-disc list-inside ml-4 text-xs space-y-0.5 text-muted-foreground">
                          {Object.entries(role)
                            .filter(([permissionKey, permissionValue]) => permissionKey !== 'address' && typeof permissionValue === 'boolean' && permissionValue === true)
                            .map(([permissionKey]) => (
                              <li key={permissionKey}>{permissionKey}</li>
                            ))}
                          {Object.entries(role)
                            .filter(([permissionKey, permissionValue]) => permissionKey !== 'address' && typeof permissionValue === 'boolean' && permissionValue === true)
                            .length === 0 && <li>No specific permissions enabled.</li>}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : typeof value === 'object' || Array.isArray(value) ? (
                  <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>
                ) : (
                  String(value)
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // VM Query Executor functions
  const stringToHex = (str: string): string => {
    return str.split("").map(c => c.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase()).join("");
  };

  const handleAddArgInput = () => {
    setArgsInputs([...argsInputs, ""]);
  };

  const handleRemoveArgInput = (indexToRemove: number) => {
    setArgsInputs(argsInputs.filter((_, index) => index !== indexToRemove));
  };

  const handleArgInputChange = (indexToChange: number, value: string) => {
    setArgsInputs(
      argsInputs.map((arg, index) => (index === indexToChange ? value : arg))
    );
  };

  const handleVmQuerySubmit = async () => {
    setIsVmQueryLoading(true);
    setVmQueryError(null);
    setVmQueryResponse(null);

    if (!scAddressInput.trim() || !funcNameInput.trim()) {
      setVmQueryError("SC Address and Function Name cannot be empty.");
      setIsVmQueryLoading(false);
      return;
    }

    try {
      const hexEncodedArgs = argsInputs
        .filter(arg => arg.trim() !== "")
        .map(arg => stringToHex(arg.trim()));
      
      const payload = {
        scAddress: scAddressInput.trim(),
        funcName: funcNameInput.trim(),
        args: hexEncodedArgs,
      };

      const response = await fetch("https://devnet-gateway.multiversx.com/vm-values/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `HTTP error! status: ${response.status}. Response not in JSON format.` };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setVmQueryResponse(data);
    } catch (err: any) {
      console.error("Error executing VM query:", err);
      setVmQueryError(err.message || "Failed to execute VM query. Please check your inputs and try again.");
      setVmQueryResponse(null);
    } finally {
      setIsVmQueryLoading(false);
    }
  };

  const renderVmQueryResponseTable = (responseData: any) => {
    if (!responseData || typeof responseData !== 'object' || Object.keys(responseData).length === 0) {
      return <p className="text-muted-foreground p-4 text-center">No response data to display.</p>;
    }

    const renderRows = (data: any, level: number = 0): JSX.Element[] => {
      return Object.entries(data).flatMap(([key, value]) => {
        const paddingLeft = level * 20; // px for indentation

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const objectHeaderRow = (
            <TableRow key={`${key}-header-${level}`}>
              <TableCell
                className="font-semibold bg-muted/70 text-foreground"
                style={{ paddingLeft: `${paddingLeft}px` }}
              >
                {key}
              </TableCell>
              <TableCell className="bg-muted/70"></TableCell>
            </TableRow>
          );
          const nestedRows = renderRows(value, level + 1);
          return [objectHeaderRow, ...nestedRows];
        }

        return (
          <TableRow key={`${key}-${level}`}>
            <TableCell
              className="font-medium align-top break-words"
              style={{ paddingLeft: `${paddingLeft}px` }}
            >
              {key}
            </TableCell>
            <TableCell className="align-top break-words whitespace-pre-wrap">
              {Array.isArray(value) ? (
                <div className="space-y-1">
                  {(value as any[]).map((item: any, index: number) => (
                    <pre key={index} className="p-2 border rounded-md bg-background text-xs shadow-sm">
                      {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                    </pre>
                  ))}
                  {value.length === 0 && <span className="text-xs text-muted-foreground">Empty array</span>}
                </div>
              ) : typeof value === 'object' && value !== null ? (
                <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>
              ) : (
                String(value)
              )}
            </TableCell>
          </TableRow>
        );
      });
    };

    return (
      <Table className="bg-card">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%] font-semibold text-foreground">Property</TableHead>
            <TableHead className="font-semibold text-foreground">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {renderRows(responseData)}
        </TableBody>
      </Table>
    );
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 bg-secondary">
      <Card className="w-full max-w-lg shadow-2xl rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <CardTitle className="text-4xl font-extrabold text-center text-primary tracking-tight">
            HashSwift
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground pt-1">
            Securely calculate the SHA-256 hash of any file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="file-upload" className="text-base font-medium text-foreground sr-only">
              Upload File
            </Label>
            <div
              className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors
                ${isHashLoading ? "opacity-60 cursor-not-allowed" : "hover:border-accent focus-within:border-accent"}
                ${hashError ? "border-destructive" : "border-border"}`}
              onClick={() => !isHashLoading && document.getElementById('file-upload')?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') !isHashLoading && document.getElementById('file-upload')?.click()}}
              tabIndex={isHashLoading ? -1 : 0}
              role="button"
              aria-label="File upload area"
            >
              <UploadCloud className={`w-12 h-12 mb-3 ${hashError ? 'text-destructive' : 'text-accent'}`} />
              <p className="mb-2 text-base text-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">Any file type accepted</p>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isHashLoading}
                aria-hidden="true"
              />
            </div>
            {selectedFile && !hashError && !isHashLoading && (
              <div className="flex items-center p-3 border rounded-md bg-card text-sm text-muted-foreground">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Selected: <span className="font-medium text-foreground ml-1">{selectedFile.name}</span>
              </div>
            )}
          </div>

          {isHashLoading && (
            <div className="flex items-center justify-center space-x-2 text-accent p-4 rounded-md bg-accent/10">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-base font-medium">Calculating hash...</span>
            </div>
          )}

          {hashError && (
            <Alert variant="destructive" className="shadow-md">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-semibold">Error</AlertTitle>
              <AlertDescription>{hashError}</AlertDescription>
            </Alert>
          )}

          {fileHash && !isHashLoading && !hashError && (
            <div className="space-y-3 pt-2">
              <Label htmlFor="sha256-hash" className="text-base font-medium text-foreground">
                SHA-256 Hash
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="sha256-hash"
                  type="text"
                  value={fileHash}
                  readOnly
                  className="font-mono text-sm bg-muted text-muted-foreground flex-grow p-3 h-11 shadow-inner"
                  aria-label="Calculated SHA-256 hash"
                />
                <Button
                  onClick={handleCopyHash}
                  variant="outline"
                  size="icon"
                  className="border-accent text-accent hover:bg-accent hover:text-accent-foreground h-11 w-11 flex-shrink-0 shadow-sm hover:shadow-md transition-shadow"
                  aria-label="Copy hash to clipboard"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl shadow-2xl rounded-xl mt-8">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-center mb-2">
             <FileJson className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-center text-primary tracking-tight">
            NFT Collection Details
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground pt-1">
            Enter a MultiversX NFT collection name to fetch its details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="collection-name-input" className="text-base font-medium text-foreground">
              Collection Name
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="collection-name-input"
                type="text"
                value={collectionNameInput}
                onChange={(e) => setCollectionNameInput(e.target.value)}
                placeholder="e.g., COLNUM01-0e2995"
                disabled={isCollectionLoading}
                className="flex-grow p-3 h-11"
                aria-label="NFT Collection Name Input"
              />
              <Button
                onClick={handleFetchCollection}
                disabled={isCollectionLoading}
                variant="default"
                size="default"
                className="h-11 shadow-sm hover:shadow-md transition-shadow"
                aria-label="Fetch collection data"
              >
                {isCollectionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                <span className={isCollectionLoading ? "sr-only" : "ml-2"}>Fetch</span>
              </Button>
            </div>
          </div>

          {isCollectionLoading && (
            <div className="flex items-center justify-center space-x-2 text-accent p-4 rounded-md bg-accent/10">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-base font-medium">Fetching collection data...</span>
            </div>
          )}

          {collectionError && (
            <Alert variant="destructive" className="shadow-md">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-semibold">Error Fetching Collection</AlertTitle>
              <AlertDescription>{collectionError}</AlertDescription>
            </Alert>
          )}

          {collectionData && !isCollectionLoading && !collectionError && (
            <div className="space-y-3 pt-2">
              <Label className="text-base font-medium text-foreground">
                Collection Data for: <span className="text-accent">{collectionData.collection || collectionNameInput}</span>
              </Label>
              <ScrollArea className="h-96 w-full rounded-md border bg-muted/50 shadow-inner">
                {renderCollectionDataTable(collectionData)}
              </ScrollArea>
            </div>
          )}
           {!collectionData && !isCollectionLoading && !collectionError && (
            <div className="text-center text-muted-foreground p-4">
              <p>No data to display. Fetch a collection to see its details.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VM Query Executor Card */}
      <Card className="w-full max-w-4xl shadow-2xl rounded-xl mt-8">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-center mb-2">
             <Terminal className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-center text-primary tracking-tight">
            VM Query Executor
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground pt-1">
            Execute smart contract queries on the MultiversX devnet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sc-address" className="text-base font-medium">SC Address</Label>
              <Input
                id="sc-address"
                value={scAddressInput}
                onChange={(e) => setScAddressInput(e.target.value)}
                disabled={isVmQueryLoading}
                className="p-3 h-11"
                placeholder="erd1..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="func-name" className="text-base font-medium">Function Name</Label>
              <Input
                id="func-name"
                value={funcNameInput}
                onChange={(e) => setFuncNameInput(e.target.value)}
                disabled={isVmQueryLoading}
                className="p-3 h-11"
                placeholder="e.g., getSum"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Arguments (human-readable, will be hex-encoded)</Label>
            {argsInputs.map((arg, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={arg}
                  onChange={(e) => handleArgInputChange(index, e.target.value)}
                  placeholder={`Argument ${index + 1}`}
                  disabled={isVmQueryLoading}
                  className="flex-grow p-3 h-11"
                  aria-label={`Argument ${index + 1}`}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveArgInput(index)}
                  disabled={isVmQueryLoading}
                  className="h-11 w-11 flex-shrink-0 shadow-sm hover:shadow-md"
                  aria-label={`Remove argument ${index + 1}`}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={handleAddArgInput}
              disabled={isVmQueryLoading}
              className="mt-2 h-11 shadow-sm hover:shadow-md"
            >
              <Plus className="mr-2 h-5 w-5" /> Add Argument
            </Button>
          </div>

          <Button 
            onClick={handleVmQuerySubmit} 
            disabled={isVmQueryLoading} 
            className="w-full mt-4 h-12 text-base shadow-md hover:shadow-lg transition-shadow"
            size="lg"
          >
            {isVmQueryLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
            Execute VM Query
          </Button>

          {isVmQueryLoading && (
            <div className="flex items-center justify-center space-x-2 text-accent p-4 rounded-md bg-accent/10 mt-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-base font-medium">Executing VM Query...</span>
            </div>
          )}

          {vmQueryError && (
            <Alert variant="destructive" className="shadow-md mt-4">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-semibold">VM Query Error</AlertTitle>
              <AlertDescription>{vmQueryError}</AlertDescription>
            </Alert>
          )}

          {vmQueryResponse && !isVmQueryLoading && !vmQueryError && (
            <div className="space-y-3 pt-4 mt-4">
              <Label className="text-base font-medium text-foreground">
                VM Query Response
              </Label>
              <ScrollArea className="h-72 w-full rounded-md border bg-muted/50 shadow-inner">
                {renderVmQueryResponseTable(vmQueryResponse)}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>


      <footer className="mt-12 text-center pb-8">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} HashSwift, NFT Explorer & VM Query.
          File hashing is done locally. Data fetched from MultiversX APIs.
        </p>
      </footer>
    </main>
  );
}

