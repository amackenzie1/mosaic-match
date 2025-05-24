import {
  trackAnalysisGeneration,
  trackError,
} from "@/components/analytics/analytics";
import { Progress } from "@/components/ui/progress";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { getToken, hashFile, signFile } from "@/lib/utils/hashAuthentication";
import { parseIMessage } from "@/lib/utils/imessage";
import { deleteFileWithPresignedUrl } from "@/lib/utils/s3cache";
import { anonymizeFile, uploadToS3 } from "@amackenzie1/mosaic-lib";
import { parse, sanitizeFilename } from "@amackenzie1/mosaic-lib";
import { fetchAuthSession } from "aws-amplify/auth";
import JSZip from "jszip";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { ZipFileDialog } from "./ZipFileDialog";

export interface ZipFile {
  name: string;
  preview: string;
  date: Date;
}

export interface WithFileUploadAndParseProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  zipFiles: ZipFile[];
  isZipDialogOpen: boolean;
  handleZipFileSelection: (fileName: string) => void;
  setIsZipDialogOpen: (isOpen: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploadProgress: number;
}

export const withFileUploadAndParse = <P extends object>(
  WrappedComponent: React.ComponentType<P & WithFileUploadAndParseProps>
) => {
  return (props: P & { onUploadSuccess?: (chatId: string) => void }) => {
    const router = useRouter();
    const [state, setState] = useState({
      error: null as string | null,
      isProcessing: false,
      uploadProgress: 0,
      isZipDialogOpen: false,
    });
    const [zipState, setZipState] = useState({
      files: [] as ZipFile[],
      content: null as JSZip | null,
    });
    const { setParsedData, setToken, setHash, setFile } = useGeneralInfo();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateProgress = (progress: number) => {
      setState((prev) => ({ ...prev, uploadProgress: Math.max(progress, 5) }));
    };

    const uploadProcess = async (file: File) => {
      const { tokens } = await fetchAuthSession();
      const fileHash = await hashFile(file);
      setHash(fileHash);
      setFile(file);

      // Upload directly to S3 as before (for large files)
      await uploadToS3(file, fileHash, false, updateProgress);
      
      // Log IP address in a separate request (no file content)
      try {
        // Log the upload metadata with IP address to track users
        await fetch('/api/file-upload/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileHash,
            fileName: file.name,
            fileType: file.type,
          }),
        });
        console.log("Logged file metadata:", {
          fileHash,
          fileName: file.name,
          fileType: file.type,
        });
      } catch (error) {
        console.error("Failed to log file metadata:", error);
        // Don't block the main flow if logging fails
      }
      
      const refreshToken = () => getToken(fileHash, file, 3600);
      const token = await refreshToken();
      setToken(token);

      if (tokens) {
        await signFile(fileHash, file);
      }

      router.push("/main");
      props.onUploadSuccess?.(fileHash);
    };

    const extractTextFromZip = async (file: File) => {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      setZipState((prev) => ({ ...prev, content: contents }));

      const txtFiles = Object.keys(contents.files).filter((name) =>
        name.endsWith(".txt")
      );
      if (!txtFiles.length)
        throw new Error("No text file found in the zip archive");

      const filesPreviews = (
        await Promise.all(
          txtFiles.map(async (fileName) => {
            const textContent = await contents.file(fileName)!.async("string");
            if (!textContent || textContent.length < 3000) return null;

            const isImessage = textContent.includes(": not_me:");
            const preview = isImessage
              ? extractImessagePreview(textContent, fileName)
              : extractNormalPreview(textContent, fileName);

            return preview;
          })
        )
      ).filter(Boolean);

      filesPreviews.sort(
        (a, b) => (b?.date.getTime() || 0) - (a?.date.getTime() || 0)
      );
      setZipState((prev) => ({ ...prev, files: filesPreviews as ZipFile[] }));
      setState((prev) => ({ ...prev, isZipDialogOpen: true }));
    };

    const extractImessagePreview = (content: string, fileName: string) => ({
      name: fileName,
      preview: content
        .split("\n")
        .filter((line) => line?.trim())
        .map((line) => line.split(": ").slice(1).join(": "))
        .filter((line) => line?.trim())
        .slice(-3)
        .join("\n"),
      date: new Date(fileName.split("_")[2].split(".")[0]),
    });

    const extractNormalPreview = (content: string, fileName: string) => ({
      name: fileName,
      preview: content
        .split("\n")
        .filter((line) => line?.trim())
        .slice(-3)
        .join("\n"),
      date: new Date(),
    });

    const extractTextFromDb = async (file: File): Promise<string> => {
      const hash = await hashFile(file);
      const fileName = `imessage/${hash}.db`;
      
      // Upload directly to S3 as before
      await uploadToS3(file, fileName, false, (progress) => {
        updateProgress(progress);
      });
      
      // Log IP address in a separate request (no file content)
      try {
        await fetch('/api/file-upload/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileHash: hash,
            fileName: file.name,
            fileType: 'iMessageDB',
          }),
        });
        console.log("Logged file metadata:", {
          fileHash: hash,
          fileName: file.name,
          fileType: 'iMessageDB',
        });
      } catch (error) {
        console.error("Failed to log file metadata:", error);
        // Don't block the main flow if logging fails
      }
      
      const response = await parseIMessage(fileName, file);
      const rawFile = await fetch(response.presigned_url).then((r) => r.blob());
      await deleteFileWithPresignedUrl(response.presigned_delete_url);
      const newFile = new File([rawFile], "chat.zip", {
        type: "application/zip",
      });
      await extractTextFromZip(newFile);
      return "";
    };

    const processFileUpload = async (file: File) => {
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
        uploadProgress: 5,
      }));

      const startTime = Date.now();

      try {
        const sanitizedFileName = sanitizeFilename(file.name);
        const newFile = new File([file], sanitizedFileName, {
          type: file.type,
        });

        if (file.name === "SampleChat.txt") {
          const text = await file.text();
          const [parsedData, _] = await Promise.all([
            parse(text),
            uploadProcess(newFile),
          ]);
          setParsedData(parsedData);
          trackAnalysisGeneration("sample", Date.now() - startTime);
        } else if (file.name.endsWith(".zip")) {
          await extractTextFromZip(newFile);
          trackAnalysisGeneration("zip", Date.now() - startTime);
        } else if (file.name.endsWith(".db")) {
          await extractTextFromDb(newFile);
          trackAnalysisGeneration("db", Date.now() - startTime);
        } else {
          const text = await file.text();
          const [parsedData, _] = await Promise.all([
            parse(text),
            uploadProcess(newFile),
          ]);
          setParsedData(parsedData);
          trackAnalysisGeneration("text", Date.now() - startTime);
        }
      } catch (error) {
        console.error(error);
        setState((prev) => ({
          ...prev,
          error: "Error processing file. Please try again.",
        }));
        trackError(
          "file_processing",
          error instanceof Error
            ? error.message
            : "Unknown error processing file"
        );
      } finally {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          uploadProgress: 0,
        }));
      }
    };

    const handleZipFileSelection = async (fileName: string) => {
      setState((prev) => ({
        ...prev,
        isZipDialogOpen: false,
        isProcessing: true,
        error: null,
        uploadProgress: 0,
      }));

      try {
        if (!zipState.content) {
          throw new Error(
            "Zip content not found. Please try uploading the file again."
          );
        }

        const sanitizedFileName = sanitizeFilename(fileName);
        const selectedFile = zipState.content.file(fileName);

        if (!selectedFile) {
          throw new Error("Selected file not found in the zip archive.");
        }

        const textContent = await selectedFile.async("string");
        const parsedData = await parse(textContent);
        setParsedData(parsedData);

        const dummyFile = new File([textContent], sanitizedFileName, {
          type: "text/plain",
        });
        await uploadProcess(dummyFile);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        }));
      } finally {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          uploadProgress: 0,
        }));
      }
    };

    const onFileUpload = (file: File) => {
      processFileUpload(file);
    };

    return (
      <>
        <WrappedComponent
          {...props}
          onFileUpload={onFileUpload}
          isLoading={state.isProcessing}
          error={state.error}
          zipFiles={zipState.files}
          isZipDialogOpen={state.isZipDialogOpen}
          handleZipFileSelection={handleZipFileSelection}
          setIsZipDialogOpen={(isOpen) =>
            setState((prev) => ({ ...prev, isZipDialogOpen: isOpen }))
          }
          fileInputRef={fileInputRef}
          uploadProgress={state.uploadProgress}
        />
        {state.isProcessing && (
          <div className="w-full mt-4 max-w-[600px] mx-auto">
            <Progress value={state.uploadProgress} />
          </div>
        )}
        {ZipFileDialog({
          isOpen: state.isZipDialogOpen,
          onClose: () => {
            setState((prev) => ({ ...prev, isZipDialogOpen: false }));
            setZipState((prev) => ({ ...prev, files: [], content: null }));
            fileInputRef.current!.value = "";
          },
          zipFiles: zipState.files,
          onFileSelect: handleZipFileSelection,
        })}
      </>
    );
  };
};
