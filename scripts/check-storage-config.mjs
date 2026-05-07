import { loadEnv } from '../backend/env.js';
import { getStorageHealth } from '../backend/storageService.js';

const main = async () => {
  await loadEnv();
  const status = getStorageHealth();

  console.log('E-Malla Rwanda storage readiness check');
  console.log(`Provider: ${status.provider}`);
  console.log(`Cloudinary live ready: ${status.liveReady ? 'yes' : 'no'}`);
  console.log(`Base folder: ${status.baseFolder}`);
  console.log(`Max image upload: ${status.maxImageUploadMb}MB`);
  console.log(`Max document upload: ${status.maxDocumentUploadMb}MB`);
  console.log('');

  if (status.provider !== 'cloudinary') {
    console.log('Storage fallback mode is active. Uploads will stay local/base64 for development.');
    return;
  }

  if (!status.liveReady) {
    throw new Error(
      'Cloudinary provider is selected but required secrets are incomplete. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, and CLOUDINARY_UPLOAD_FOLDER.'
    );
  }

  console.log('Cloudinary configuration looks ready for live uploads.');
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
