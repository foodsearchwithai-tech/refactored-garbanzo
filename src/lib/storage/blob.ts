// Client-side upload utilities that work with our API routes

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
}

export async function uploadImage(
  file: File,
  entityType: 'restaurant' | 'menu_item' | 'review' | 'user_profile' | 'certification',
  entityId: string
): Promise<UploadResult> {
  try {
    // Validate file first
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop();
    const filename = `${entityType}/${entityId}/${timestamp}-${randomString}.${extension}`;

    // Upload via our API route
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
      method: 'POST',
      body: file, // Send file directly as body
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    
    return {
      url: result.url,
      filename: result.filename,
      size: file.size,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

export async function uploadMultipleImages(
  files: File[],
  entityType: 'restaurant' | 'menu_item' | 'review' | 'user_profile' | 'certification',
  entityId: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => 
    uploadImage(file, entityType, entityId)
  );
  
  return Promise.all(uploadPromises);
}

export async function deleteImage(url: string): Promise<void> {
  try {
    const response = await fetch(`/api/upload?url=${encodeURIComponent(url)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
}

// Utility function to validate image files
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.',
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Please upload images smaller than 5MB.',
    };
  }

  return { isValid: true };
}

// Helper function to resize images on the client side
export function resizeImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const width = img.width * ratio;
      const height = img.height * ratio;

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          const resizedFile = new File([blob!], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}
