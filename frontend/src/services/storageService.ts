import { auth } from '@/lib/firebase';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const storageService = {
  /**
   * Uploads a file securely using a backend-generated Signed URL
   */
  async uploadFileSecurely(file: File): Promise<string> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Not authenticated");

    // 1. Ask backend for an upload URL
    const res = await fetch(`${API_BASE_URL}/storage/generate-upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        file_name: file.name,
        content_type: file.type
      })
    });
    
    if (!res.ok) throw new Error("Failed to get signed URL");
    const { url, blob_name } = await res.json();

    // 2. Upload the file directly to Google Cloud Storage using the Signed URL
    const uploadRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    });

    if (!uploadRes.ok) throw new Error("Failed to upload file to bucket");

    // Return the blob_name so the frontend can save it to Firestore/Database
    return blob_name; 
  },

  /**
   * Gets a secure download URL for an existing file
   */
  async getSecureDownloadUrl(blobName: string): Promise<string> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_BASE_URL}/storage/generate-download-url?blob_name=${encodeURIComponent(blobName)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Failed to get download URL");
    const { url } = await res.json();
    return url;
  }
};
