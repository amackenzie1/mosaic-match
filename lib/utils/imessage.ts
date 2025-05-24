import axios, { AxiosError } from "axios";
import { getToken } from "./hashAuthentication";

// Function to call the API Gateway
export type ParseIMessageResponse = {
  presigned_url: string;
  presigned_delete_url: string;
};
export async function parseIMessage(
  key: string,
  file: File
): Promise<ParseIMessageResponse> {
  const maxRetries = 3;
  let retries = 0;
  const token = await getToken(key, file, 3600);
  while (retries < maxRetries) {
    try {
      const response = await axios.post(
        process.env.NEXT_PUBLIC_RUST_LAMBDA_ENDPOINT!,
        {
          action: "imessage",
          key,
          token,
        }
      );
      if (response.data && response.data.presigned_url) {
        console.log("imessage response", response.data);
        return response.data as ParseIMessageResponse;
      } else {
        throw new Error("Presigned URL not returned from Lambda");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          // If we have a response, it's an HTTP error, so we don't retry
          throw error;
        }
      }

      retries++;
      if (retries === maxRetries) {
        throw new Error(
          `Error parsing iMessage after ${maxRetries} attempts: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
      // Wait for 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // This line is technically unreachable, but TypeScript might complain without it
  throw new Error("Unexpected error in parseIMessage");
}

export async function parseImessageDb(file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    process.env.NEXT_PUBLIC_RUST_LAMBDA_ENDPOINT!,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}
