# Cloudinary Storage Configuration

This application uses **Cloudinary** for file storage (images, PDFs, documents) for the "My Recipes" feature.

## Setup Instructions

### 1. Create a Cloudinary Account
1. Sign up for free at [cloudinary.com](https://cloudinary.com)
2. Navigate to your Dashboard
3. Find your **Cloud Name**, **API Key**, and **API Secret**

### 2. Configure Environment Variable

Update the `STORAGE_URL` in `/app/backend/.env` with your Cloudinary credentials:

```bash
STORAGE_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
```

**Format Explanation:**
- `cloudinary://` - Protocol prefix (required)
- `API_KEY` - Your Cloudinary API Key
- `API_SECRET` - Your Cloudinary API Secret
- `CLOUD_NAME` - Your Cloudinary Cloud Name

**Example:**
```bash
STORAGE_URL="cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz123456@my-cloud-name"
```

### 3. Restart the Backend

After updating the `.env` file:

```bash
sudo supervisorctl restart backend
```

## Features

### File Upload
- Supports images (`.jpg`, `.png`, `.gif`, etc.)
- Supports documents (`.pdf`, `.doc`, `.docx`)
- Auto-detection of file types
- Unique filename generation to prevent conflicts
- Organized folder structure: `freshtrack/recipes/{user_id}/`

### File Storage
- Files stored in Cloudinary cloud storage
- Secure HTTPS URLs for all files
- Direct URL access (no proxying required)
- Automatic format optimization

### File Download
- Direct download from Cloudinary URLs
- No bandwidth usage on your server
- Fast CDN delivery worldwide

### File Deletion
- Automatic cleanup from Cloudinary when deleted from app
- Soft-delete in database for audit trail

## Technical Details

### Backend Implementation
- **Library**: `cloudinary` Python package (v1.44.1+)
- **Initialization**: `cloudinary.config(cloudinary_url=STORAGE_URL)`
- **Upload**: `cloudinary.uploader.upload()` with auto resource type detection
- **Delete**: `cloudinary.uploader.destroy()` with proper resource type

### Database Schema
Files are tracked in MongoDB with:
```python
{
    'id': str,                      # Unique file ID
    'recipe_id': str,               # Associated recipe
    'cloudinary_url': str,          # Direct Cloudinary URL
    'cloudinary_public_id': str,    # Cloudinary identifier
    'resource_type': str,           # 'image', 'raw', 'video'
    'original_filename': str,       # Original upload name
    'content_type': str,            # MIME type
    'size': int,                    # File size in bytes
    'is_deleted': bool,             # Soft delete flag
    'user_id': str,                 # File owner
    'created_at': str               # ISO timestamp
}
```

## API Endpoints

### Upload File
```http
POST /api/my-recipes/{recipe_id}/upload
Content-Type: multipart/form-data

file: <binary file data>
```

**Response:**
```json
{
    "id": "uuid",
    "filename": "recipe.pdf",
    "size": 12345,
    "content_type": "application/pdf",
    "url": "https://res.cloudinary.com/..."
}
```

### Download File
```http
GET /api/my-recipes/{recipe_id}/files/{file_id}/download
```

**Response:** 302 Redirect to Cloudinary URL

### Delete File
```http
DELETE /api/my-recipes/{recipe_id}/files/{file_id}
```

## Cloudinary Free Tier Limits

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Media Library**: Up to 25,000 assets

Perfect for small to medium applications!

## Troubleshooting

### "Storage initialization failed"
- Check that `STORAGE_URL` is properly formatted
- Verify your Cloudinary credentials are correct
- Ensure API secret has no special characters that need escaping

### "File upload failed"
- Check file size (Cloudinary free tier has 10MB limit per file)
- Verify file type is supported
- Check Cloudinary dashboard for quota limits

### Files not appearing
- Verify Cloudinary account is active
- Check browser console for CORS errors
- Verify `cloudinary_url` field exists in MongoDB records

## Migration from Emergent Object Storage

If migrating from previous Emergent Object Storage:
1. Existing files will remain in old storage
2. New uploads automatically go to Cloudinary
3. Download endpoints check for `cloudinary_url` field
4. Old files can be migrated manually if needed

## Security Notes

- Never commit `.env` files to version control
- Keep API Secret confidential
- Use environment variables for all credentials
- Cloudinary URLs are public but unpredictable (security through obscurity)
- Consider enabling signed URLs for sensitive content

## Support

For Cloudinary-specific issues:
- Documentation: https://cloudinary.com/documentation
- Support: https://support.cloudinary.com
