import { PinataSDK } from "pinata";

// Initialize Pinata SDK
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: "example-gateway.mypinata.cloud" // Replace with your gateway
});

export interface DocumentMetadata {
  fileName: string;
  fileType: string;
  userId: string;
  documentType: 'application' | 'lease' | 'income_verification' | 'id_document' | 'other';
  uploadedAt: string;
  isShared: boolean;
}

export class PinataService {
  /**
   * Upload a file to IPFS via Pinata
   */
  static async uploadFile(file: File, metadata: DocumentMetadata): Promise<string> {
    try {
      const upload = await pinata.upload.file(file).addMetadata({
        name: metadata.fileName,
        keyValues: {
          userId: metadata.userId,
          documentType: metadata.documentType,
          uploadedAt: metadata.uploadedAt,
          isShared: metadata.isShared.toString(),
          fileType: metadata.fileType
        }
      });

      return upload.IpfsHash;
    } catch (error) {
      console.error('Pinata upload error:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  /**
   * Upload JSON data to IPFS
   */
  static async uploadJSON(data: any, name: string): Promise<string> {
    try {
      const upload = await pinata.upload.json(data).addMetadata({
        name: name
      });

      return upload.IpfsHash;
    } catch (error) {
      console.error('Pinata JSON upload error:', error);
      throw new Error('Failed to upload JSON to IPFS');
    }
  }

  /**
   * Get file from IPFS
   */
  static async getFile(ipfsHash: string): Promise<any> {
    try {
      const data = await pinata.gateways.get(ipfsHash);
      return data;
    } catch (error) {
      console.error('Pinata get file error:', error);
      throw new Error('Failed to retrieve file from IPFS');
    }
  }

  /**
   * List files uploaded by a user
   */
  static async getUserFiles(userId: string): Promise<any[]> {
    try {
      const files = await pinata.files.list().metadata({
        userId: userId
      });

      return files.files || [];
    } catch (error) {
      console.error('Pinata list files error:', error);
      throw new Error('Failed to list user files');
    }
  }

  /**
   * Share a document by making it publicly accessible
   */
  static async shareDocument(ipfsHash: string): Promise<string> {
    try {
      // Create a shareable link
      const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      return gatewayUrl;
    } catch (error) {
      console.error('Pinata share document error:', error);
      throw new Error('Failed to create shareable link');
    }
  }

  /**
   * Delete a file from Pinata
   */
  static async deleteFile(ipfsHash: string): Promise<void> {
    try {
      await pinata.files.delete([ipfsHash]);
    } catch (error) {
      console.error('Pinata delete file error:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Update file metadata
   */
  static async updateFileMetadata(ipfsHash: string, metadata: Partial<DocumentMetadata>): Promise<void> {
    try {
      await pinata.files.update({
        id: ipfsHash,
        name: metadata.fileName,
        keyValues: {
          ...(metadata.userId && { userId: metadata.userId }),
          ...(metadata.documentType && { documentType: metadata.documentType }),
          ...(metadata.isShared !== undefined && { isShared: metadata.isShared.toString() }),
          ...(metadata.fileType && { fileType: metadata.fileType })
        }
      });
    } catch (error) {
      console.error('Pinata update metadata error:', error);
      throw new Error('Failed to update file metadata');
    }
  }
}

export default PinataService;