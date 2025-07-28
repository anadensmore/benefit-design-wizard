# Maven Wallet Benefits Design Tool

A comprehensive web application for sales teams to configure client benefit designs through an intuitive wizard interface.

## Features

- **Welcome Screen**: Maven Clinic-styled landing page with hero section
- **Template Selection**: Choose from 4 pre-built templates or create custom configurations
- **Custom Package Configuration**: Detailed form for client information and reporting cadence
- **Population Management**: Configure benefit populations with claim submission windows and dates
- **Category Configuration**: Set up benefit categories with format, structure, and amount fields
- **Expense Type Management**: Comprehensive expense type configuration with conditional fields
- **Database Storage**: Full Node.js backend with SQLite database for persistent storage
- **Configuration Management**: View, edit, and delete saved configurations

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Responsive design with mobile support
- CSS Grid and Flexbox layouts
- Modern form controls and validation

### Backend
- Node.js with Express.js framework
- SQLite database with proper schema design
- RESTful API endpoints
- CORS enabled for cross-origin requests

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Open your browser to `http://localhost:3000`
   - The application will automatically create the SQLite database on first run

## Project Structure

```
benefit-design-wizard/
├── server/
│   ├── server.js           # Express server configuration
│   ├── database.js         # Database class and schema
│   └── benefit_configurations.db  # SQLite database (auto-created)
├── css/
│   ├── styles.css          # Global styles and Maven Clinic theme
│   ├── custom-package.css  # Configuration form styles
│   ├── templates.css       # Template selection styles
│   └── configurations.css  # Configuration management styles
├── js/
│   ├── main.js            # Welcome page functionality
│   ├── templates.js       # Template selection logic
│   ├── custom-package.js  # Main configuration form logic
│   └── configurations.js  # Configuration management
├── images/                # Static images and assets
├── index.html            # Welcome/landing page
├── templates.html        # Template selection page
├── custom-package.html   # Configuration form page
├── configurations.html   # Saved configurations page
├── package.json          # Node.js dependencies and scripts
└── README.md            # This file
```

## API Endpoints

### Configuration Management
- `GET /api/configurations` - Get all configurations
- `GET /api/configurations/:id` - Get specific configuration
- `POST /api/configurations` - Save new configuration
- `PUT /api/configurations/:id` - Update existing configuration
- `DELETE /api/configurations/:id` - Delete configuration

### Health Check
- `GET /api/health` - Server health status

## Configuration Structure

The application supports complex benefit configurations with:

### Client Information
- Client name
- Reporting cadence (weekly, bi-weekly, monthly)
- Day selection for reporting

### Populations
- Population name and description
- Claim submission window (default 180 days)
- Launch and end dates
- Runout period (default 180 days)

### Categories
- Category name
- Format (Currency, Cycles)
- Structure (Lifetime, Hybrid, Per Event, Unlimited, Annual)
- Dynamic amount fields based on format/structure
- Start and end dates

### Expense Types
- 8 expense type categories:
  - Fertility, Adoption, Preservation, Surrogacy
  - Donor, Maternity, Menopause, Parenting & Pediatrics
- Historical spend tracking
- Reimbursement method (Payroll, Direct Deposit)
- User level (Household, Individual)
- Direct payment and coverage type options
- Subcategories for each expense type
- Complex eligibility rules
- Taxation configuration

## Database Schema

### benefit_configurations
- `id` (TEXT PRIMARY KEY)
- `client_name` (TEXT NOT NULL)
- `configuration_data` (TEXT NOT NULL) - JSON blob
- `created_at` (TEXT NOT NULL)
- `updated_at` (TEXT NOT NULL)

### Supporting Tables
- `populations` - Population details
- `categories` - Category configurations
- `expense_types` - Expense type settings

## Development

### Adding New Features

1. **Frontend Changes**: Modify HTML, CSS, and JavaScript files
2. **Backend Changes**: Update `server/server.js` for new endpoints
3. **Database Changes**: Modify `server/database.js` for schema updates

### Styling Guidelines

- Use CSS custom properties (variables) defined in `styles.css`
- Follow Maven Clinic color scheme (#00856F primary green)
- Maintain responsive design principles
- Use consistent spacing and typography

### JavaScript Best Practices

- Use modern ES6+ features (async/await, arrow functions)
- Implement proper error handling with try/catch
- Follow modular function design
- Add comprehensive form validation

## Production Deployment

### Vercel Deployment (Recommended)

This application is configured for deployment on Vercel with serverless functions:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Production**
   ```bash
   vercel --prod
   ```

3. **Features in Deployed Version**
   - Serverless API functions in `/api` directory
   - Demo configurations for testing
   - In-memory storage (resets on deployment)
   - All core functionality preserved

### Traditional Server Deployment

1. **Environment Variables**
   ```bash
   export PORT=3000
   export NODE_ENV=production
   ```

2. **Database Backup**
   - The SQLite database file is stored in `server/benefit_configurations.db`
   - Regular backups recommended for production use

3. **Security Considerations**
   - Add authentication middleware if needed
   - Implement rate limiting for API endpoints
   - Use HTTPS in production
   - Validate and sanitize all user inputs

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

## License

© 2024 Maven Clinic. All rights reserved.