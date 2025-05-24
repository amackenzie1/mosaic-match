import { fetchAuthSession } from "aws-amplify/auth";
import axios from "axios";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";

async function getNonceFromLambda(
  id: string,
  endpoint: string = process.env.NEXT_PUBLIC_PUBLIC_LAMBDA_ENDPOINT!
): Promise<string> {
  const headers = await getHeaders(endpoint);
  try {
    const response = await axios.post(
      endpoint,
      {
        action: "nonce",
        id: id,
      },
      { headers }
    );

    if (response.data && response.data.nonce) {
      return response.data.nonce;
    } else {
      throw new Error("Nonce not returned from Lambda");
    }
  } catch (error: any) {
    throw new Error(`Error getting nonce from Lambda: ${error.message}`);
  }
}

async function generateHash(
  fileContent: ArrayBuffer,
  nonce: string
): Promise<string> {
  try {
    const wordArray = CryptoJS.lib.WordArray.create(fileContent);
    const combinedWordArray = CryptoJS.lib.WordArray.create()
      .concat(wordArray)
      .concat(CryptoJS.enc.Utf8.parse(nonce));
    return CryptoJS.SHA256(combinedWordArray).toString(CryptoJS.enc.Hex);
  } catch (error: any) {
    throw new Error(`Error generating hash: ${error.message}`);
  }
}

export async function hashFile(file: File): Promise<string> {
  const fileContent = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(fileContent);
  return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
}

export async function getHeaders(
  endpoint: string
): Promise<Record<string, string>> {
  if (endpoint === process.env.NEXT_PUBLIC_AUTH_LAMBDA_ENDPOINT!) {
    const { tokens } = await fetchAuthSession();
    if (!tokens || !tokens.idToken) {
      throw new Error("No access token available (getting headers?)");
    }
    return {
      Authorization: `Bearer ${tokens.idToken.toString()}`,
    };
  }
  return {};
}

async function getTokenFromLambda(
  hash: string,
  s3FileName: string,
  nonce: string,
  id: string,
  expiration?: number
): Promise<string> {
  try {
    const response = await axios.post(
      process.env.NEXT_PUBLIC_PUBLIC_LAMBDA_ENDPOINT!,
      {
        action: "token",
        id,
        nonce,
        hash,
        file: s3FileName,
        expiration,
      }
    );

    if (response.data && response.data.token) {
      return response.data.token;
    } else {
      throw new Error("Token not returned from Lambda");
    }
  } catch (error: any) {
    throw new Error(`Error calling Lambda: ${error.message}`);
  }
}

async function signFileWithLambda(
  hash: string,
  s3FileName: string,
  nonce: string
): Promise<void> {
  const headers = await getHeaders(
    process.env.NEXT_PUBLIC_AUTH_LAMBDA_ENDPOINT!
  );
  try {
    const response = await axios.post(
      process.env.NEXT_PUBLIC_AUTH_LAMBDA_ENDPOINT!,
      {
        action: "sign",
        nonce,
        hash,
        file: s3FileName,
      },
      { headers }
    );
    console.log("sign response", response);
  } catch (error: any) {
    throw new Error(`Error signing file with Lambda: ${error.message}`);
  }
}

export async function getToken(
  s3FileName: string,
  file: File | null,
  expiration?: number
): Promise<string> {
  try {
    if (!file) {
      return "";
    }
    const uuid = uuidv4();
    const nonce = await getNonceFromLambda(uuid);
    const fileContent = await file.arrayBuffer();
    const hash = await generateHash(fileContent, nonce);
    return await getTokenFromLambda(hash, s3FileName, nonce, uuid, expiration);
  } catch (error: any) {
    throw new Error(`Error getting token: ${error.message}`);
  }
}

export async function signFile(fileName: string, file: File): Promise<void> {
  const nonce = await getNonceFromLambda(
    "unused",
    process.env.NEXT_PUBLIC_AUTH_LAMBDA_ENDPOINT!
  );
  const fileContent = await file.arrayBuffer();
  const hash = await generateHash(fileContent, nonce);
  await signFileWithLambda(hash, fileName, nonce);
}

export async function getOwnedFiles(): Promise<string[]> {
  const headers = await getHeaders(
    process.env.NEXT_PUBLIC_AUTH_LAMBDA_ENDPOINT!
  );
  const response = await axios.post(
    process.env.NEXT_PUBLIC_AUTH_LAMBDA_ENDPOINT!,
    {
      action: "list",
    },
    { headers }
  );
  const data = response.data.files as { hash: string }[];
  return data.map((file: any) => file.hash);
}

export async function amIAuthedOwner(hash: string): Promise<boolean> {
  const { tokens } = await fetchAuthSession();
  if (!tokens || !tokens.idToken) {
    return false;
  }
  const ownedFiles = await getOwnedFiles();
  return ownedFiles.includes(hash);
}

export async function getTokenThroughAuth(
  hash: string,
  expiration?: number
): Promise<string> {
  const { tokens } = await fetchAuthSession();
  if (!tokens || !tokens.idToken) {
    return "";
  }
  const headers = {
    Authorization: `Bearer ${tokens.idToken.toString()}`,
  };
  const response = await axios.post(
    process.env.NEXT_PUBLIC_AUTH_LAMBDA_ENDPOINT!,
    {
      action: "token",
      hash,
      expiration,
    },
    { headers }
  );
  return response.data.token;
}
