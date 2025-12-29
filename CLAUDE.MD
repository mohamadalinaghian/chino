# Chino - Cafe/Restaurant Management System

## Project Overview

Chino is a full-stack web application designed for cafe and restaurant management in the Iranian market. It provides comprehensive business management capabilities including sales tracking, menu management, inventory control, and document handling with full Persian/Farsi localization support.

## Architecture

### System Design
- **Type**: Full-stack web application
- **Pattern**: Client-server architecture with RESTful API
- **Deployment**: Containerized with Docker/Docker Compose

### Tech Stack

#### Frontend
- **Framework**: Next.js 15.5.7 with React 19.1.0
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 4.1.11
- **State Management**: Zustand 5.0.9
- **Form Handling**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library
- **Features**: PWA support, Lottie animations

#### Backend
- **Framework**: Django (Python 3.10+)
- **API Framework**: Django-Ninja (modern REST API framework)
- **Database**: PostgreSQL 18
- **WSGI Server**: Gunicorn
- **Reverse Proxy**: Nginx

#### DevOps
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Makefile commands
- **CI/CD**: Pre-commit hooks, GitHub Actions
- **Container Support**: Docker and Podman

## Directory Structure

```
/home/user/chino/
├── backend/                          # Django backend application
│   ├── apps/                         # Modular Django apps
│   │   ├── sale/                    # Sales/invoicing module
│   │   ├── menu/                    # Menu management
│   │   ├── inventory/               # Inventory/stock management
│   │   ├── user/                    # Authentication & user management
│   │   ├── documents/               # Document handling
│   │   ├── core_setting/            # Core system settings
│   │   └── utils/                   # Shared utilities
│   ├── api/                          # API layer
│   │   ├── endpoints/               # API endpoint definitions
│   │   ├── schemas/                 # Serialization schemas
│   │   └── security/                # Authentication & security
│   ├── config/                       # Django configuration
│   │   └── settings/                # Environment-specific settings
│   ├── requirements/                 # Python dependencies
│   │   ├── dev.txt                  # Development dependencies
│   │   └── prod.txt                 # Production dependencies
│   └── manage.py                    # Django management script
│
├── frontend/                         # Next.js frontend
│   └── nextjs_code/
│       ├── src/
│       │   ├── app/                 # Next.js App Router (routing)
│       │   │   ├── login/           # Authentication pages
│       │   │   ├── sale/            # Sales management UI
│       │   │   └── menu/            # Menu management UI
│       │   ├── components/          # Reusable React components
│       │   ├── hooks/               # Custom React hooks
│       │   ├── service/             # API service layer
│       │   ├── types/               # TypeScript type definitions
│       │   ├── libs/                # Utility libraries
│       │   └── __mocks__/           # Testing mocks
│       └── package.json
│
├── nginx/                            # Reverse proxy configuration
│   ├── conf.d/                      # Nginx config files
│   ├── Dockerfile.dev               # Dev Nginx container
│   └── Dockerfile.prod              # Prod Nginx container
│
├── compose.dev.yml                  # Development Docker Compose
├── compose.prod.yml                 # Production Docker Compose
├── Makefile                         # Development commands
└── pyproject.toml                   # Python project config
```

## Development Setup

### Prerequisites
- Docker and Docker Compose (or Podman)
- Node.js 18+ and npm (for local frontend development)
- Python 3.10+ (for local backend development)

### Environment Configuration

1. **Backend Environment**: Copy and configure `.env.dev.example` or `.env.prod.example`
2. **Make Configuration**: Copy `.env.make.example` for Makefile settings

### Quick Start

```bash
# Start all services (development)
make up

# View logs
make logs

# Stop all services
make down

# Rebuild containers
make build
```

### Frontend Development

```bash
cd frontend/nextjs_code

# Install dependencies
npm install

# Development server (with Turbopack)
npm run dev

# Build production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

### Backend Development

```bash
# Access Django shell
make shell

# Run backend tests
make test_backend

# Lint backend code
make lint_backend

# Access database shell
make dbshell

# Create database backup
make backup_db

# Apply migrations
make migrate

# Create superuser
make createsuperuser
```

## Key Features & Modules

### Sales Management (`backend/apps/sale/`)
- Invoice creation and management
- Sales tracking and reporting
- Transaction history
- Revenue analytics

### Menu Management (`backend/apps/menu/`)
- Product/menu item management
- Category organization
- Pricing and availability
- Menu item metadata

### Inventory Management (`backend/apps/inventory/`)
- Stock tracking
- Inventory levels
- Product variants
- Supply management

### User Management (`backend/apps/user/`)
- Authentication and authorization
- User profiles
- Role-based access control
- Session management

### Document Handling (`backend/apps/documents/`)
- PDF generation with Persian support
- Document templates
- Export functionality

## Coding Conventions

### Backend (Django)

**Architecture Pattern**:
- **Models**: Database schema in `models.py`
- **Services**: Business logic in `services/` directory
- **Policies**: Authorization logic in `policies.py`
- **Managers**: Custom query logic in managers
- **API**: Django-Ninja endpoints in `api/endpoints/`

**Code Style**:
- Formatter: Ruff (replaces Black and isort)
- Linter: Ruff
- Type hints: Encouraged
- Docstrings: Google style

**Testing**:
- Framework: pytest
- Location: Tests alongside app code
- Coverage: Aim for high coverage on business logic

### Frontend (Next.js/React)

**Architecture Pattern**:
- **Pages**: App Router in `src/app/`
- **Components**: Reusable components in `src/components/`
- **Services**: API calls in `src/service/`
- **Hooks**: Custom hooks in `src/hooks/`
- **Types**: TypeScript definitions in `src/types/`

**Code Style**:
- TypeScript strict mode enabled
- ESLint for linting
- Prettier integration
- Component naming: PascalCase
- File naming: camelCase or kebab-case

**State Management**:
- Zustand for global state
- React Hook Form for form state
- Server state: API service layer

**Testing**:
- Framework: Jest + React Testing Library
- Test files: `*.test.ts` or `*.test.tsx`
- Coverage: Component behavior and integration

## Localization

### Persian/Farsi Support
- **Calendar**: Jalali calendar integration
- **Text Processing**: Arabic reshaping for RTL display
- **PDF Generation**: ReportLab with Arabic Reshaper and python-bidi
- **UI Direction**: RTL layout support
- **Number Formatting**: Persian number formatting

## API Documentation

### Framework
- **Django-Ninja**: OpenAPI/Swagger compatible
- **Documentation**: Auto-generated API docs
- **Access**: `/api/docs` endpoint (in development)

### Authentication
- Token-based authentication
- Session management
- Rate limiting enabled

## Database

### PostgreSQL 18
- **Migrations**: Django migrations in `apps/*/migrations/`
- **Backup**: Use `make backup_db`
- **Access**: Use `make dbshell`

### Schema Management
- Always create migrations for model changes
- Review migrations before committing
- Test migrations on dev before production

## Testing Strategy

### Backend Testing
```bash
# Run all backend tests
make test_backend

# Run specific app tests
cd backend && python manage.py test apps.sale

# Run with coverage
pytest --cov=apps
```

### Frontend Testing
```bash
cd frontend/nextjs_code

# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Deployment

### Development
```bash
make up
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Database: PostgreSQL on port 5432

### Production
```bash
# Build production images
docker-compose -f compose.prod.yml build

# Start production services
docker-compose -f compose.prod.yml up -d

# View logs
docker-compose -f compose.prod.yml logs -f
```

## Common Commands Reference

### Makefile Commands
```bash
make up              # Start all services
make down            # Stop all services
make build           # Build containers
make logs            # View logs
make shell           # Django shell
make dbshell         # Database shell
make migrate         # Run migrations
make makemigrations  # Create migrations
make test_backend    # Run backend tests
make lint_backend    # Lint backend code
make backup_db       # Backup database
make restore_db      # Restore database
make createsuperuser # Create Django superuser
```

## Troubleshooting

### Common Issues

**Port conflicts**: Check if ports 3000, 8000, or 5432 are already in use
```bash
lsof -i :3000
lsof -i :8000
lsof -i :5432
```

**Database connection**: Ensure PostgreSQL container is running
```bash
docker-compose ps
```

**Frontend build errors**: Clear Next.js cache
```bash
cd frontend/nextjs_code
rm -rf .next node_modules
npm install
```

**Migration conflicts**: Reset migrations (development only)
```bash
make shell
python manage.py migrate --fake
```

## Security Considerations

- Never commit `.env` files
- Use environment variables for secrets
- Enable CORS only for trusted origins
- Implement rate limiting on API endpoints
- Validate all user inputs
- Use Django's built-in security features
- Keep dependencies updated

## Performance Optimization

### Frontend
- Next.js automatic code splitting
- Image optimization with next/image
- Lazy loading components
- PWA caching strategies

### Backend
- Database query optimization
- Django ORM select_related/prefetch_related
- Redis caching (if configured)
- Gunicorn worker tuning

## Contributing

### Git Workflow
1. Create feature branch from main
2. Make changes with clear commits
3. Run tests locally
4. Submit pull request
5. Code review required

### Pre-commit Hooks
Configured in `.pre-commit-config.yaml`:
- Code formatting
- Linting
- Type checking

## Project-Specific Notes

### Recent Changes (from git history)
- New sale page created with pending bug fix
- Sync sale functionality fixed
- Menu UI updates
- Text size adjustments in sale pages

### Active Development Areas
- Sales module enhancements
- Menu management UI improvements
- Bug fixes in sale page functionality

## Resources

### Documentation
- Django: https://docs.djangoproject.com/
- Django-Ninja: https://django-ninja.rest-framework.com/
- Next.js: https://nextjs.org/docs
- React: https://react.dev/
- TailwindCSS: https://tailwindcss.com/docs

### Tools
- Ruff: https://docs.astral.sh/ruff/
- Zustand: https://github.com/pmndrs/zustand
- React Hook Form: https://react-hook-form.com/

---

**Last Updated**: 2025-12-29
**Maintainer**: Development Team
**License**: Proprietary
