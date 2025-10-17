# Vercel Deployment Guide

## Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Create a Vercel account at https://vercel.com

## Deployment Steps

### 1. Login to Vercel
```bash
vercel login
```

### 2. Deploy from the qr directory
```bash
cd qr
vercel
```

### 3. Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N**
- Project name: `slideshow-studio` (or your preferred name)
- Directory: `./` (current directory)
- Override settings? **N**

### 4. Environment Variables
Set the Flask secret key in Vercel dashboard:
- Go to your project settings
- Add environment variable: `FLASK_SECRET` with a secure random string

### 5. Important Notes

**File Storage Limitations:**
- Vercel serverless functions have limited file storage
- Files are stored in `/tmp` directory (temporary)
- Consider using external storage (AWS S3, Cloudinary) for production

**Current Setup:**
- Images are stored temporarily in `/tmp/static/uploads/`
- Data is stored in `/tmp/creations.json`
- Files may be lost between deployments

**For Production:**
- Use external file storage (AWS S3, Cloudinary, etc.)
- Use a database (PostgreSQL, MongoDB) instead of JSON files
- Implement proper file cleanup

### 6. Custom Domain (Optional)
- Go to your project settings in Vercel dashboard
- Add your custom domain
- Update DNS records as instructed

## Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python app.py
```

## Troubleshooting

### Common Issues:
1. **Import errors**: Make sure all dependencies are in requirements.txt
2. **File not found**: Check file paths are relative to project root
3. **Memory issues**: Vercel has memory limits for serverless functions

### Debug:
- Check Vercel function logs in dashboard
- Use `vercel logs` command
- Test locally first with `vercel dev`
