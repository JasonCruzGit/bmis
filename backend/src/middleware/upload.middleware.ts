import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(__dirname, '../../uploads');

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine upload directory based on route
    // Check originalUrl first as it contains the full path including /api prefix
    const originalUrl = req.originalUrl || '';
    const baseUrl = req.baseUrl || '';
    const reqPath = req.path || '';
    
    // Combine all possible path sources for checking
    const checkPath = `${baseUrl}${reqPath}${originalUrl}`.toLowerCase();
    
    let type = 'general';
    if (checkPath.includes('/projects')) {
      type = 'projects';
    } else if (checkPath.includes('/residents')) {
      type = 'residents';
    } else if (checkPath.includes('/documents')) {
      type = 'documents';
    } else if (checkPath.includes('/incidents')) {
      type = 'incidents';
    } else if (checkPath.includes('/announcements')) {
      type = 'announcements';
    } else if (checkPath.includes('/officials')) {
      type = 'officials';
    } else if (checkPath.includes('/financial')) {
      type = 'financial';
    } else if (checkPath.includes('/inventory')) {
      type = 'inventory';
    } else {
      type = req.params.type || 'general';
    }
    
    const typeDir = path.join(uploadDir, type);
    
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
    
    cb(null, typeDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || 
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.mimetype === 'application/vnd.ms-excel';

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
  },
  fileFilter
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number = 10) => 
  upload.array(fieldName, maxCount);
export const uploadFields = (fields: { name: string; maxCount?: number }[]) =>
  upload.fields(fields);

