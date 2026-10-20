import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream', // Some browsers send octet-stream for docx
]);
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

@Injectable()
export class GoogleDriveService {
  logger = new Logger(GoogleDriveService.name);
  driveClient = null;

  getDriveClient() {
    if (this.driveClient) {
      return this.driveClient;
    }

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const projectId = process.env.GOOGLE_PROJECT_ID;

    if (!clientEmail || !privateKey || clientEmail.includes('your-service-account')) {
      throw new BadRequestException(
        'Google Drive Service Account is not properly configured. Please set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in .env'
      );
    }

    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: formattedPrivateKey,
        project_id: projectId,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.driveClient = google.drive({ version: 'v3', auth });
    return this.driveClient;
  }

  validateFile(file) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed limit of 5 MB (Current size: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`
      );
    }

    const originalNameLower = (file.originalname || '').toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => originalNameLower.endsWith(ext));
    const hasValidMime = ALLOWED_MIME_TYPES.has(file.mimetype);

    if (!hasValidExt && !hasValidMime) {
      throw new BadRequestException(
        `Invalid file type. Only PDF and Word documents (.pdf, .doc, .docx) up to 5 MB are allowed.`
      );
    }
  }

  async uploadResume({ buffer, originalname, mimetype, size, candidateName }) {
    this.validateFile({ originalname, mimetype, size });

    const drive = this.getDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const sanitizedCandidate = (candidateName || 'Candidate').replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
    const sanitizedOriginal = (originalname || 'resume.pdf').replace(/[^a-zA-Z0-9._\- ]/g, '');
    const fileName = `Resume - ${sanitizedCandidate} - ${Date.now()} - ${sanitizedOriginal}`;

    const fileMetadata = {
      name: fileName,
      parents: folderId ? [folderId] : undefined,
    };

    const media = {
      mimeType: mimetype,
      body: Readable.from(buffer),
    };

    this.logger.log(`Uploading file "${fileName}" to Google Drive folder: ${folderId || 'root'}`);

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, mimeType, webViewLink, webContentLink',
      supportsAllDrives: true,
    });

    const fileId = res.data.id;

    // Grant public read permission so view link works for recruiters/interviewers
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      });
      this.logger.log(`Set public view permissions on Drive file ${fileId}`);
    } catch (permErr) {
      this.logger.warn(`Could not set public permissions on Drive file ${fileId}: ${permErr.message}`);
    }

    return {
      fileId,
      fileName: res.data.name,
      mimeType: res.data.mimeType,
      webViewLink: res.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    };
  }

  buildDriveUrls(fileIdOrUrl) {
    if (!fileIdOrUrl) {
      return {
        resumeUrl: null,
        resumePreviewUrl: null,
        resumeDownloadUrl: null,
        resumeFileId: null,
      };
    }

    // If it's already a full HTTP(S) link
    if (fileIdOrUrl.startsWith('http://') || fileIdOrUrl.startsWith('https://')) {
      const driveMatch = fileIdOrUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      const extractedId = driveMatch ? driveMatch[1] : null;

      if (extractedId) {
        return {
          resumeUrl: `https://drive.google.com/file/d/${extractedId}/view`,
          resumePreviewUrl: `https://drive.google.com/file/d/${extractedId}/preview`,
          resumeDownloadUrl: `https://drive.google.com/uc?id=${extractedId}&export=download`,
          resumeFileId: extractedId,
        };
      }

      return {
        resumeUrl: fileIdOrUrl,
        resumePreviewUrl: fileIdOrUrl,
        resumeDownloadUrl: fileIdOrUrl,
        resumeFileId: null,
      };
    }

    // It's a Google Drive File ID
    const fileId = fileIdOrUrl;
    return {
      resumeUrl: `https://drive.google.com/file/d/${fileId}/view`,
      resumePreviewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      resumeDownloadUrl: `https://drive.google.com/uc?id=${fileId}&export=download`,
      resumeFileId: fileId,
    };
  }

  formatCandidate(candidate) {
    if (!candidate) return candidate;

    const urls = this.buildDriveUrls(candidate.resumeUrl);

    return {
      ...candidate,
      resumeUrl: urls.resumeUrl,
      resumePreviewUrl: urls.resumePreviewUrl,
      resumeDownloadUrl: urls.resumeDownloadUrl,
      resumeFileId: urls.resumeFileId,
    };
  }
}
