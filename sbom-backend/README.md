# SBOM Finder Backend

This is the backend service for the SBOM Finder application that manages Software Bill of Materials (SBOM) data.

## Features

- Store and retrieve SBOM data in CycloneDX format
- Search SBOMs by name, category, OS, binary type with fuzzy matching
- Compare two SBOMs side by side
- Generate statistics about SBOMs
- Upload and generate new SBOMs

## Tech Stack

- Node.js/Express.js for REST API
- MongoDB Atlas for database
- Mongoose for MongoDB object modeling
- Multer for file uploads

## Setup

### Prerequisites

- Node.js 14+ installed
- MongoDB Atlas account or local MongoDB instance
- Git

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd sbom-finder-frontend/sbom-backend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb+srv://sbom_user:Joyce22@sbom-finder.mongodb.net/sbom-finder?retryWrites=true&w=majority
JWT_SECRET=sbom_secure_secret_2024
JWT_EXPIRE=30d
MAX_UPLOAD_SIZE=50MB
```

4. Start the server
```bash
npm run dev
```

5. Import existing SBOM data (optional)
```bash
npm run import
```

### API Endpoints

#### SBOM Management
- `GET /api/sboms/metadata` - Get metadata for all SBOMs
- `GET /api/sboms` - Get all SBOMs with full content
- `GET /api/sbom/:id` - Get a specific SBOM by ID
- `GET /api/sbom-file/:filename` - Get a specific SBOM by filename
- `POST /api/sboms/import` - Import SBOMs from a directory
- `DELETE /api/sbom/:id` - Delete a SBOM

#### Search
- `GET /api/search` - Search SBOMs by various criteria
- `POST /api/search-components` - Search for components within SBOMs
- `POST /api/compare` - Compare two SBOMs
- `GET /api/suggestions` - Get field suggestions for autocomplete

#### Statistics
- `GET /api/statistics` - Get general SBOM statistics
- `GET /api/platform-stats` - Get platform-specific statistics

#### Upload
- `POST /api/upload` - Upload a new SBOM file
- `POST /api/generate-sbom` - Generate a SBOM from a binary file

## Database Structure

The application uses MongoDB with the following main collection:

- **SBOMs**: Stores SBOM data with metadata for efficient searching

## Project Structure

```
sbom-backend/
├── config/         # Configuration files
├── controllers/    # API route controllers
├── middleware/     # Express middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── scripts/        # Utility scripts
├── uploads/        # SBOM file storage
├── utils/          # Utility functions
├── .env            # Environment variables
├── package.json    # Project dependencies
├── server.js       # Main application file
└── README.md       # This file
```

## License

This project is licensed under the MIT License. 