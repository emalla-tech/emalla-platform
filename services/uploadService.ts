import { apiUrl } from './apiConfig';

const request = async (path: string, init: RequestInit = {}) => {
  const token = localStorage.getItem('emalla_token');
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Upload request failed');
  }

  return data;
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Unable to read image file: ${file.name}`));
    reader.readAsDataURL(file);
  });

type UploadOptions = {
  folder?: string;
  allowedTypes?: string[];
  maxSizeMb?: number;
};

const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_DOCUMENT_TYPES = [...DEFAULT_IMAGE_TYPES, 'application/pdf'];

const validateFile = (file: File, options: UploadOptions = {}) => {
  const allowedTypes = options.allowedTypes || DEFAULT_IMAGE_TYPES;
  const maxSizeMb = options.maxSizeMb || 8;
  const isAllowed = allowedTypes.some((type) =>
    type.endsWith('/') ? file.type.startsWith(type) : file.type === type
  );

  if (!isAllowed) {
    throw new Error('Unsupported file type. Allowed formats are JPG, JPEG, PNG, WEBP, and PDF where applicable.');
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    throw new Error(`File is too large. Maximum allowed size is ${maxSizeMb}MB.`);
  }
};

export const uploadService = {
  async uploadAsset(file: File, options: UploadOptions = {}) {
    validateFile(file, options);
    const dataUrl = await fileToDataUrl(file);
    const response = await request('/uploads/image', {
      method: 'POST',
      body: JSON.stringify({
        dataUrl,
        fileName: file.name,
        folder: options.folder
      })
    });

    return response.upload as {
      url: string;
      provider: string;
      publicId?: string | null;
      note?: string;
      resourceType?: string | null;
      format?: string | null;
      mimeType?: string;
    };
  },

  async uploadProductImage(file: File) {
    return this.uploadAsset(file, {
      folder: 'e-malla/products',
      allowedTypes: DEFAULT_IMAGE_TYPES,
      maxSizeMb: 8
    });
  },

  async uploadSellerBrandImage(file: File) {
    return this.uploadAsset(file, {
      folder: 'e-malla/branding',
      allowedTypes: DEFAULT_IMAGE_TYPES,
      maxSizeMb: 8
    });
  },

  async uploadBannerImage(file: File) {
    return this.uploadAsset(file, {
      folder: 'e-malla/banners',
      allowedTypes: DEFAULT_IMAGE_TYPES,
      maxSizeMb: 8
    });
  },

  async uploadProfilePhoto(file: File) {
    return this.uploadAsset(file, {
      folder: 'e-malla/profiles',
      allowedTypes: DEFAULT_IMAGE_TYPES,
      maxSizeMb: 6
    });
  },

  async uploadSellerDocument(file: File) {
    return this.uploadAsset(file, {
      folder: 'e-malla/applications',
      allowedTypes: DEFAULT_DOCUMENT_TYPES,
      maxSizeMb: 12
    });
  }
};
