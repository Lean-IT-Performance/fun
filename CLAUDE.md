# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fun Lean IT Performance** is a collection of lightweight, performance-focused web applications that run entirely client-side to ensure data privacy. The project includes:

1. **Sobre** - Scientific blood alcohol calculator using the Widmark formula
2. **Mes Recettes** - AI-powered recipe generator using GPT-4o-mini
3. **Console Admin** - OpenAI API cost monitoring and management dashboard

## Architecture

### Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript ES6+ (no frameworks)
- **AI Integration**: OpenAI GPT-4o-mini API for recipe generation
- **Backend**: Minimal PHP endpoints for admin authentication
- **Deployment**: FTP-based deployment scripts
- **Testing**: Jest for unit tests, Playwright for E2E tests

### Project Structure
```
fun/
├── index.html, styles.css, script.js    # Homepage
├── config.js                            # Centralized configuration manager
├── sobre/                               # Blood alcohol calculator
├── recettes/                            # AI recipe generator
├── admin/                               # OpenAI monitoring console
├── scripts/                             # Deployment automation
├── test/                                # Comprehensive test suite
└── api/                                 # PHP backend endpoints
```

## Development Commands

### Setup and Installation
```bash
npm install                    # Install dependencies
cp .env.example .env          # Configure environment variables
```

### Development Server
```bash
npm run serve                 # Start development server on port 8080
npm run serve:test           # Start in test mode
```

### Testing
```bash
npm test                     # Run all tests
npm run test:unit           # Unit tests only
npm run test:api            # API tests only
npm run test:ui             # Functional UI tests
npm run test:browser        # Open browser test runner
npm run test:watch          # Jest watch mode
npm run test:coverage       # Generate coverage report
```

### Deployment
```bash
npm run deploy              # Interactive deployment
npm run deploy:homepage     # Deploy homepage only
npm run deploy:sobre        # Deploy Sobre app
npm run deploy:recettes     # Deploy recipe generator
npm run deploy:admin        # Deploy admin console
npm run deploy:all          # Deploy everything
npm run check               # Validate deployment files
```

## Configuration

### Environment Variables (.env)
```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORG_ID=your_org_id

# Admin Console
ADMIN_USERNAME=admin_username
ADMIN_PASSWORD=secure_password

# FTP Deployment
FTP_HOST=your_ftp_host
FTP_USER=your_ftp_username
FTP_PASS=your_ftp_password
FTP_DIR=
FTP_PORT=21
FTP_SECURE=false
```

### Security Considerations
- API keys are managed through the ConfigManager class in `config.js`
- Recipe generator uses Service Worker proxy for API key protection
- Admin console uses session-based authentication (4-hour timeout)
- All sensitive data stored client-side only (localStorage/sessionStorage)

## Key Technical Components

### Config Manager (`config.js`)
Centralized configuration system that:
- Loads environment variables securely
- Provides fallback configurations
- Validates required credentials
- Offers debug information without exposing secrets

### Sobre Calculator
- Implements enhanced Widmark formula: `BAC = (A × 0.8) / (W × r) - (β × t)`
- Factors: weight, gender, digestive state, time elapsed
- Real-time calculations with sobriety predictions
- Mobile-first responsive design

### AI Recipe Generator
- Uses GPT-4o-mini for personalized recipe creation
- Service Worker architecture for API security
- Handles dietary constraints, serving sizes, cooking time
- Structured JSON responses with detailed instructions

### Admin Console
- Real-time OpenAI API cost monitoring
- Interactive charts (Chart.js) for usage visualization
- Configurable alerts and auto-refresh
- Responsive dashboard with mobile support

## Testing Architecture

The project includes comprehensive testing:

- **Unit Tests**: Algorithm validation (Widmark formula, calculations)
- **API Tests**: Authentication, OpenAI integration, error handling
- **Functional Tests**: UI interactions, form validation, data persistence
- **Integration Tests**: End-to-end scenarios with Playwright

### Test Configuration
- Jest for unit tests with jsdom environment
- Playwright for browser automation
- Custom test runner with HTML interface
- Automatic test execution before deployment

## Deployment System

### FTP-Based Deployment
- Node.js scripts for cross-platform deployment (Windows/macOS/Linux)
- Selective deployment by application or complete site
- Automatic file validation and dependency checking
- Pre-deployment test execution to prevent broken builds

### Scripts Available
- `deploy-simple.js`: Primary deployment script (recommended)
- `deploy-multi.js`: Interactive deployment with advanced options
- `deploy-admin.js`: Specialized admin console deployment

## Development Guidelines

### Code Style
- Pure vanilla JavaScript - no external frameworks
- Mobile-first responsive design approach
- CSS Grid and Flexbox for layouts
- LocalStorage for client-side persistence
- Scientific accuracy critical for calculations

### Performance Targets
- Initial load: < 2 seconds
- Interface responsiveness: < 100ms
- Total app size per module: < 500KB
- Browser compatibility: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+

### Security Best Practices
- Never hard-code API keys or credentials
- Use ConfigManager for all sensitive configuration
- Validate all user inputs client-side
- Include appropriate disclaimers for calculation tools
- Implement proper CORS handling for API requests

## Error Handling and Debugging

### Logging
- Console logging available in development mode
- Error capture for API failures and validation issues
- Service Worker debugging for recipe generation
- Admin console includes debug information panel

### Common Issues
- API key configuration: Use ConfigManager debug methods
- FTP deployment: Verify credentials and file permissions
- Test failures: Check server availability and clean localStorage
- Service Worker: Clear browser cache and reinstall worker

## Legal and Safety Considerations

### Disclaimers Required
- Blood alcohol calculations are estimates only
- Not suitable for determining driving safety
- Educational and harm reduction purposes only
- Consult professionals for medical/legal advice

### Privacy
- All data processing occurs client-side
- No server-side data storage or tracking
- LocalStorage used for user preferences only
- Open source and auditable codebase