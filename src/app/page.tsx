
"use client";

import * as React from "react";
import { UploadCloud, Loader2, Copy, AlertCircle, FileText, Search, X, Plus, Send, Terminal, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function HashSwiftPage() {
  // States for HashSwift (SHA-256 calculator)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileHash, setFileHash] = React.useState<string | null>(null);
  const [isHashLoading, setIsHashLoading] = React.useState<boolean>(false);
  const [hashError, setHashError] = React.useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = React.useState<boolean>(false);
  const { toast } = useToast();

  // States for VM Query Executor
  const [scAddressInput, setScAddressInput] = React.useState<string>("erd1qqqqqqqqqqqqqpgqkd7q05rf5l8q74dhv8hx0atkuf7lxpad0qes8h26jv");
  const [funcNameInput, setFuncNameInput] = React.useState<string>("getPrintInfoFromHash");
  const [argsInputs, setArgsInputs] = React.useState<string[]>(["3486f3dda9ffec7a8e416e00c2634f02e798dab3cf728cf5214bc8f7e4ca69a5"]);
  const [vmQueryResponse, setVmQueryResponse] = React.useState<any | null>(null);
  const [isVmQueryLoading, setIsVmQueryLoading] = React.useState<boolean>(false);
  const [vmQueryError, setVmQueryError] = React.useState<string | null>(null);
  const [openGroups, setOpenGroups] = React.useState<Record<number, boolean>>({});
  const [isQueryParametersOpen, setIsQueryParametersOpen] = React.useState<boolean>(false);


  const processFile = async (fileToProcess: File | null) => {
    if (fileToProcess) {
      setSelectedFile(fileToProcess);
      setHashError(null);
      setFileHash(null);
      setIsHashLoading(true);
      try {
        const arrayBuffer = await fileToProcess.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        setFileHash(hashHex);

        const newVmArgs = [hashHex];
        setArgsInputs(newVmArgs);

        await handleVmQuerySubmit(newVmArgs);

      } catch (err) {
        console.error("Error processing file or executing VM query:", err);
        setHashError("Failed to calculate hash or execute VM query. Please try again.");
        setFileHash(null);
      } finally {
        setIsHashLoading(false);
      }
    } else {
      setSelectedFile(null);
      setFileHash(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file || null);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isHashLoading) {
      setIsDraggingOver(true);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isHashLoading && !isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    if (isHashLoading) {
      return;
    }
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      processFile(droppedFiles[0]);
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

  const handleVmQuerySubmit = async (overrideArgs?: string[]) => {
    setIsVmQueryLoading(true);
    setVmQueryError(null);
    setVmQueryResponse(null);
    setOpenGroups({});

    if (!scAddressInput.trim() || !funcNameInput.trim()) {
      setVmQueryError("SC Address and Function Name cannot be empty.");
      setIsVmQueryLoading(false);
      return;
    }

    try {
      const currentArgs = overrideArgs || argsInputs;
      const processedArgs = currentArgs
        .filter(arg => arg.trim() !== "")
        .map(arg => arg.trim());

      const payload = {
        scAddress: scAddressInput.trim(),
        funcName: funcNameInput.trim(),
        args: processedArgs,
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
        if (response.status === 400) {
          setVmQueryError("Bad VM Query");
        } else {
          let errorData;
          try {
            errorData = await response.json();
            setVmQueryError(errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`);
          } catch (e) {
            setVmQueryError(`HTTP error! status: ${response.status}. Response not in JSON format.`);
          }
        }
        setIsVmQueryLoading(false);
        return;
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

  const decodeBase64 = (base64String: string, decodeAs: 'string' | 'number' = 'string'): string => {
    if (base64String === null || base64String === undefined) {
      return decodeAs === 'number' ? "Error: Input is null/undefined" : "";
    }
    if (base64String === "") {
      return decodeAs === 'number' ? "0" : "";
    }

    try {
      const binaryString = atob(base64String);
      const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));

      if (decodeAs === 'number') {
        if (bytes.length === 0) {
          return "0";
        }
        let result = 0n;
        for (let i = 0; i < bytes.length; i++) {
          result = (result << 8n) + BigInt(bytes[i]);
        }
        return result.toString();
      } else {
        if (bytes.length === 0) {
          return "";
        }
        try {
          return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        } catch (utf8Error) {
          let hex = "0x";
          for (let i = 0; i < bytes.length; i++) {
            hex += bytes[i].toString(16).padStart(2, '0');
          }
          return hex;
        }
      }
    } catch (e: any) {
      console.warn(`Error decoding base64 string "${base64String}" as ${decodeAs}: ${e.message}`);
      if (decodeAs === 'number') {
        return `Error: Not a valid Base64-encoded number ("${base64String}")`;
      }
      if (e.name === 'InvalidCharacterError') {
         return base64String;
      }
      return `Error decoding as string: ${e.message}`;
    }
  };

  const toggleGroup = (groupIndex: number) => {
    setOpenGroups(prev => ({ ...prev, [groupIndex]: !prev[groupIndex] }));
  };

  const renderVmQueryResponse = (responseData: any) => {
    const firstArg = argsInputs.length > 0 ? argsInputs[0] : "la valeur de hachage fournie";
    const customNoRecordMessage = `Pas d'enregistrement pour ${firstArg}.`;

    if (!responseData || typeof responseData !== 'object' || Object.keys(responseData).length === 0) {
      return <p className="text-muted-foreground p-4 text-center">Aucune donnée de réponse.</p>;
    }

    const dataBlock = responseData?.data?.data;
    const returnDataArray = dataBlock?.returnData;

    if (Array.isArray(returnDataArray) && returnDataArray.length === 0) {
        return (
            <p className="text-muted-foreground p-4 text-center">{customNoRecordMessage}</p>
        );
    }

    if (!returnDataArray || !Array.isArray(returnDataArray)) {
        let detailMessage = "";
        if (dataBlock && typeof dataBlock === 'object' && 'returnData' in dataBlock) {
            detailMessage = "La clé 'returnData' est présente mais sa valeur est nulle ou son format est inattendu (devrait être un tableau).";
        } else if (dataBlock && typeof dataBlock === 'object') {
            detailMessage = "La clé 'returnData' est absente de la section 'data.data'.";
        } else {
            detailMessage = "La structure de la réponse est inattendue ('data.data' ou 'returnData' manquants).";
        }

        return (
            <>
                <p className="text-muted-foreground p-4 text-center">
                    {customNoRecordMessage} <br /> {detailMessage} Affichage de la réponse complète :
                </p>
                <pre className="p-3 bg-muted/80 rounded-md text-sm whitespace-pre-wrap break-all font-mono">
                    {JSON.stringify(responseData, null, 2)}
                </pre>
            </>
        );
    }

    const CHUNK_SIZE = 7;
    const potentialChunks = [];
    for (let i = 0; i < returnDataArray.length; i += CHUNK_SIZE) {
      potentialChunks.push(returnDataArray.slice(i, i + CHUNK_SIZE));
    }

    const displayableChunks = potentialChunks.filter(chunk => chunk.length > 1);

    if (displayableChunks.length === 0) {
       return (
        <>
            <p className="text-muted-foreground p-4 text-center">'returnData' existe mais aucun groupe affichable (moins de 2 éléments par groupe potentiel). Affichage de la réponse complète :</p>
            <pre className="p-3 bg-muted/80 rounded-md text-sm whitespace-pre-wrap break-all font-mono">{JSON.stringify(responseData, null, 2)}</pre>
        </>
      );
    }

    return (
      <div className="space-y-4">
        {displayableChunks.map((chunk, groupIndex) => {
          if (chunk.length < 2) return null;

          const isGroupOpen = !!openGroups[groupIndex];
          const toggleHeaderContent = decodeBase64(chunk[1], 'string');

          return (
            <div key={`group-${groupIndex}`} className="p-4 border border-border rounded-lg bg-card/40 shadow-md">
              <div
                className="flex items-center justify-between p-2 border rounded-md bg-background font-mono text-sm break-all cursor-pointer hover:bg-muted/50"
                onClick={() => toggleGroup(groupIndex)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleGroup(groupIndex); }}
                aria-expanded={isGroupOpen}
                aria-controls={`group-content-${groupIndex}`}
              >
                <span className="truncate">{toggleHeaderContent || `Group ${groupIndex + 1}`}</span>
                {isGroupOpen ? <ChevronUp className="h-5 w-5 flex-shrink-0 ml-2" /> : <ChevronDown className="h-5 w-5 flex-shrink-0 ml-2" />}
              </div>

              {isGroupOpen && (
                <div id={`group-content-${groupIndex}`} className="space-y-1 mt-2">
                  {chunk.map((item: string, itemIndex: number) => {
                    if (itemIndex < 2) {
                      return null;
                    }
                    if (itemIndex >= chunk.length) {
                        return null;
                    }

                    const fieldLabels = [
                      "Nonce",
                      "Nom",
                      "Hash du fichier",
                      "Transaction",
                      "Date/Heure Enregistrement"
                    ];

                    const labelIndex = itemIndex - 2;
                    if (labelIndex < 0 || labelIndex >= fieldLabels.length) {
                        return (
                            <div key={`item-${groupIndex}-${itemIndex}-error`} className="p-2 font-mono text-xs text-destructive break-all">
                                Error: Label not found for item index {itemIndex}.
                            </div>
                        );
                    }
                    const label = fieldLabels[labelIndex];

                    let decodedItemDisplay: React.ReactNode;
                    let rawDecodedValue: string = "";

                    if (itemIndex === 2) { // Nonce (Original index 2)
                      rawDecodedValue = decodeBase64(item, 'number');
                      decodedItemDisplay = rawDecodedValue;
                    } else if (itemIndex === 6) { // Date/Heure (Original index 6)
                      const decodedNumberString = decodeBase64(item, 'number');
                      rawDecodedValue = decodedNumberString;
                      if (decodedNumberString.startsWith("Error:")) {
                        decodedItemDisplay = `Error converting to date: ${decodedNumberString}`;
                      } else {
                        try {
                          const timestamp = parseInt(decodedNumberString, 10);
                          if (isNaN(timestamp)) {
                            decodedItemDisplay = `Error: Decoded value for date is not a number ("${decodedNumberString}")`;
                          } else {
                            const dateObject = new Date(timestamp * 1000);
                            decodedItemDisplay = dateObject.toLocaleString();
                          }
                        } catch (e: any) {
                          decodedItemDisplay = `Error parsing/converting date: ${e.message}`;
                        }
                      }
                    } else {
                      rawDecodedValue = decodeBase64(item, 'string');
                      decodedItemDisplay = rawDecodedValue;
                      if ((itemIndex === 4 || itemIndex === 5) && typeof decodedItemDisplay === 'string' && decodedItemDisplay.startsWith('0x')) {
                        // itemIndex 4 = Hash du fichier, itemIndex 5 = Transaction
                        decodedItemDisplay = decodedItemDisplay.substring(2);
                         if (itemIndex === 5) rawDecodedValue = decodedItemDisplay;
                      }
                    }

                    if (itemIndex === 5 && typeof rawDecodedValue === 'string' && rawDecodedValue && !rawDecodedValue.startsWith("Error:")) {
                        const txHash = rawDecodedValue;
                        decodedItemDisplay = (
                          <a
                            href={`https://devnet-explorer.multiversx.com/transactions/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline"
                          >
                            {txHash}
                          </a>
                        );
                    }

                    return (
                      <div
                        key={`item-${groupIndex}-${itemIndex}`}
                        className="p-2 font-mono text-xs break-all"
                      >
                        <span className="font-semibold">{label}: </span>
                        {decodedItemDisplay}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
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
              className={cn(
                "flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors",
                isHashLoading
                  ? "opacity-60 cursor-not-allowed"
                  : isDraggingOver
                    ? "border-accent ring-2 ring-offset-2 ring-accent shadow-lg"
                    : hashError
                      ? "border-destructive"
                      : "border-border hover:border-accent focus-within:border-accent"
              )}
              onClick={() => !isHashLoading && document.getElementById('file-upload')?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') !isHashLoading && document.getElementById('file-upload')?.click()}}
              tabIndex={isHashLoading ? -1 : 0}
              role="button"
              aria-label="File upload area"
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <UploadCloud className={`w-12 h-12 mb-3 ${isDraggingOver ? 'text-accent' : (hashError ? 'text-destructive' : 'text-accent')}`} />
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

          {isHashLoading && !vmQueryError && (
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
             <Terminal className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-center text-primary tracking-tight">
            VM Query Executor
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground pt-1">
            Execute smart contract queries on the MultiversX devnet. Arguments should be in hex format if required by the SC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border rounded-lg shadow-sm">
            <div
              className="flex items-center justify-between p-3 cursor-pointer bg-muted/30 hover:bg-muted/50 rounded-t-lg"
              onClick={() => setIsQueryParametersOpen(!isQueryParametersOpen)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsQueryParametersOpen(!isQueryParametersOpen); }}
              aria-expanded={isQueryParametersOpen}
              aria-controls="query-parameters-content"
            >
              <h3 className="text-lg font-semibold text-primary">Query parameters</h3>
              {isQueryParametersOpen ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5 text-primary" />}
            </div>

            {isQueryParametersOpen && (
              <div id="query-parameters-content" className="p-4 space-y-6 border-t rounded-b-lg">
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
                  <Label className="text-base font-medium">Arguments (hex-encoded if required by SC)</Label>
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
                        disabled={isVmQueryLoading || argsInputs.length <= 1}
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
                  onClick={() => handleVmQuerySubmit()}
                  disabled={isVmQueryLoading}
                  className="w-full h-12 text-base shadow-md hover:shadow-lg transition-shadow"
                  size="lg"
                >
                  {isVmQueryLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                  Execute VM Query
                </Button>
              </div>
            )}
          </div>


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
                Decoded ReturnData
              </Label>
              <ScrollArea
                type="always"
                className="h-auto max-h-[40rem] w-full rounded-md border bg-muted/50 shadow-inner p-3"
              >
                {renderVmQueryResponse(vmQueryResponse)}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      <footer className="mt-12 text-center pb-8">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} HashSwift & VM Query.
          File hashing is done locally. Data fetched from MultiversX APIs.
        </p>
      </footer>
    </main>
  );
}
