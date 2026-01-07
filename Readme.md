# 🐛 Bug Logging Tool (BLT)

> Enterprise-grade Progressive Web Application for bug reporting with offline-first architecture, role-based access control, and intelligent log collection.


## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Role-Based Access Control](#role-based-access-control)
- [Desktop Application](#desktop-application)
- [Background Agent](#background-agent)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Bug Logging Tool (BLT)** is a comprehensive enterprise solution for capturing, managing, and tracking software bugs and issues. Built with modern web technologies, BLT provides a seamless experience across web, desktop, and offline environments.

### Why BLT?

- **🌐 Works Everywhere**: Web, desktop, and offline - one codebase
- **🔒 Enterprise Security**: Azure AD SSO with role-based access control
- **📱 Offline-First**: Full functionality without internet connection
- **🤖 Intelligent Logging**: Automatic log file collection from multiple sources
- **🎨 Rich Capture**: Screenshot annotation and carousel viewer
- **📊 Template System**: Pre-built templates for common bug scenarios
- **🔄 Real-Time Sync**: Seamless data synchronization across devices
- **🖥️ Dual Mode**: PWA for web + Electron for desktop with native features

---

## ✨ Key Features

### Core Functionality

#### 🎯 **Bug Reporting**
- Comprehensive form with dynamic fields
- Category-based triage system
- Supervisor tracking
- Template-driven workflows
- Azure AD user integration (auto-populate reporter info)

#### 📸 **Screenshot Management**
- **Multiple Capture Methods**:
  - Browser-based screen capture
  - Electron native screen picker
  - Custom capture area selection
- **Advanced Annotation**:
  - Draw on screenshots
  - Highlight issues
  - Save annotated versions
- **Gallery View**:
  - Thumbnail previews
  - Full-screen carousel
  - Navigation controls

#### 📄 **Log File Collection**
- **Three Collection Methods**:
  1. **Backend Service**: Direct file upload from servers
  2. **Background Agent**: Automatic collection from localhost
  3. **Electron Desktop**: Native file system access
- **Features**:
  - Preview log files in-app
  - Download functionality
  - Automatic file detection
  - Size and format display
  - Auto-collected indicator

#### 📋 **Template System**
Built-in templates for common scenarios:
1. **Pega Web Application** - Portal/UI issues
2. **Pega Backend Service** - API/service errors
3. **Database Query Issue** - SQL/database problems
4. **API Integration Problem** - External API issues
5. **User Access/Permission Issue** - Authentication/authorization

Each template includes:
- Pre-configured fields
- Conditional logic
- Troubleshooting checklists
- Auto-category assignment
- Guided workflows

### Enterprise Features

#### 🔐 **Authentication & Authorization**
- **Azure AD Single Sign-On (SSO)**:
  - Enterprise-grade authentication
  - No password management
  - Multi-tenant support
  - Token-based security
- **Role-Based Access Control (RBAC)**:
  - **User**: Create and view own reports
  - **PowerUser**: Export, delete reports
  - **ITSupport**: View all users' reports, IT tools
  - **Admin**: Full access, system management

#### 🔄 **Offline-First Architecture**
- **Full Offline Functionality**:
  - Create reports offline
  - Capture screenshots offline
  - Attach log files offline
  - View queue offline
- **Smart Synchronization**:
  - Automatic sync when online
  - Conflict resolution
  - Background sync
  - Sync status indicators
- **Service Worker**:
  - Aggressive caching
  - Offline-first strategy
  - Auto-update mechanism
  - Network-first for APIs

#### 🖥️ **Desktop Application (Electron)**
- **Native Features**:
  - System tray integration
  - Native screen capture
  - File system access
  - Custom title bar
  - Zoom controls (Ctrl +/-)
  - Window management
- **Shared Database**:
  - Same CouchDB as web app
  - Seamless data access
  - Cross-platform compatibility

#### 🤖 **Background Agent**
- **Automatic Log Collection**:
  - Runs on localhost:42080
  - Monitors specified directories
  - Auto-detects log files
  - Attaches to reports automatically
- **Easy Installation**:
  - Guided setup wizard
  - One-click installer
  - Status monitoring
  - Auto-start configuration

### User Experience

#### 🎨 **Modern UI/UX**
- Clean, intuitive interface
- Responsive design (mobile-friendly)
- Dark mode compatible
- Accessibility features
- Toast notifications
- Loading states
- Error handling

#### 📊 **Queue Management**
- **Advanced Table View**:
  - Sortable columns
  - Checkbox selection
  - Status indicators (synced/pending)
  - Thumbnail previews
  - Inline actions
- **Bulk Operations**:
  - Select multiple reports
  - Sync to JIRA
  - Export to JSON
- **Filtering** (IT/Admin):
  - My Reports
  - All Reports
  - Search functionality

#### 🔔 **Real-Time Updates**
- Event-driven architecture
- Cross-tab communication
- Auto-refresh on changes
- Sync notifications
- Update alerts

### Integration

#### 🔗 **JIRA Integration**
- Bulk sync to JIRA
- Status tracking
- Automatic ticket creation
- Attachment upload
- Bidirectional sync

#### 🗄️ **Database (PouchDB/CouchDB)**
- **PouchDB** (Client-side):
  - IndexedDB storage
  - Offline support
  - Attachment handling
- **CouchDB** (Server-side):
  - Multi-master replication
  - CORS enabled
  - Authentication
  - Change feed

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │   Web Browser    │         │  Electron App    │              │
│  │   (PWA + React)  │         │  (Desktop)       │              │
│  └────────┬─────────┘         └────────┬─────────┘              │
│           │                            │                        │
│           └────────────┬───────────────┘                        │
│                        │                                        │
│           ┌────────────▼────────────┐                           │
│           │   Service Worker        │                           │
│           │   (Caching & Offline)   │                           │
│           └────────────┬────────────┘                           │
│                        │                                        │
└────────────────────────┼─────────────────────────────────────── ┘
                         │
┌────────────────────────▼─────────────────────────────────────── ┐
│                   Local Storage Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │            PouchDB (IndexedDB)                       │       │
│  │  • Reports, Screenshots, Log Files                   │       │
│  │  • Offline-first storage                             │       │
│  │  • Attachment management                             │       │
│  └──────────────────┬───────────────────────────────────┘       │
│                     │                                           │
│                     │ Sync                                      │
│                     │                                           │
└─────────────────────┼───────────────────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────────────────── ┐
│                   Server Layer                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   CouchDB    │  │  Azure AD    │  │ Background   │            │
│  │  Database    │  │  (SSO/Auth)  │  │   Agent      │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │  JIRA API    │  │  Backend     │                              │
│  │ Integration  │  │  Service     │                              │
│  └──────────────┘  └──────────────┘                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
src/
├── components/           # React components
│   ├── AccessDenied.jsx    # RBAC access denied page
│   ├── CaptureArea.jsx     # Screenshot capture controls
│   ├── DesktopAppBanner.jsx # Desktop app promotion
│   ├── Login.jsx           # Azure AD login
│   ├── QueueView.jsx       # Report queue + RBAC features
│   ├── ReporterForm.jsx    # Bug report form
│   ├── ScreenshotManager.jsx # Screenshot management
│   ├── ScreenshotPlaceholder.jsx # Preview component
│   ├── SyncIndicator.jsx   # Sync status display
│   ├── TemplateSelector.jsx # Template picker
│   ├── UpdateNotification.jsx # PWA update alerts
│   ├── UserProfile.jsx     # User dropdown menu
│   └── ZoomControls.jsx    # Desktop zoom (Ctrl +/-)
│
├── config/              # Configuration
│   └── authConfig.js      # Azure AD MSAL config
│
├── contexts/            # React contexts
│   └── AuthContext.jsx    # Authentication context
│
├── hooks/               # Custom React hooks
│   └── useAuth.js         # Authentication hook
│
├── services/            # Business logic
│   ├── captureService.js  # Screenshot capture
│   ├── jiraService.js     # JIRA integration
│   ├── pouchdbService.js  # Database operations
│   ├── syncManager.js     # Sync orchestration
│   └── systemLogger.js    # System logging
│
├── utils/               # Utilities
│   ├── eventBus.js        # Event communication
│   └── templateHelpers.js # Template utilities
│
├── electron/            # Electron (desktop app)
│   ├── main.js            # Main process
│   ├── preload.js         # Preload script
│   └── build/             # Desktop build files
│
└── public/              # Static assets
    ├── sw.js              # Service Worker
    ├── manifest.json      # PWA manifest
    └── icons/             # App icons
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - UI framework
- **Vite 5.4.11** - Build tool and dev server
- **@azure/msal-react 2.1.0** - Azure AD authentication
- **@azure/msal-browser 3.27.0** - MSAL browser library

### Storage & Sync
- **PouchDB 9.0.0** - Local database (IndexedDB)
- **CouchDB 3.x** - Remote database with replication

### Desktop
- **Electron 28.x** - Desktop application framework
- **electron-builder** - Desktop app packaging

### PWA
- **Workbox** (via Vite PWA) - Service Worker tooling
- **vite-plugin-pwa** - PWA plugin for Vite

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Optional (for full functionality)
- **CouchDB 3.x** - For remote sync ([Download](https://couchdb.apache.org/))
- **Azure AD Tenant** - For SSO authentication ([Setup Guide](https://azure.microsoft.com/en-us/services/active-directory/))
- **JIRA Account** - For issue tracking integration

### System Requirements
- **OS**: Windows 10+, macOS 10.14+, or Linux
- **RAM**: Minimum 4GB
- **Disk Space**: 500MB free space
- **Browser**: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/bug-logging-tool.git
cd bug-logging-tool
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Desktop Dependencies (Optional)

```bash
# For Electron desktop app
npm install electron electron-builder --save-dev
```

### 4. Verify Installation

```bash
# Check Node.js version
node --version  # Should be >= 18.0.0

# Check npm version
npm --version   # Should be >= 9.0.0

# List installed packages
npm list --depth=0
```

---

## ⚙️ Configuration

### 1. Environment Variables

Create a `.env` file in the project root:

```bash
# Azure AD Configuration (Required for SSO)
VITE_AZURE_AD_CLIENT_ID=your-client-id-here
VITE_AZURE_AD_TENANT_ID=your-tenant-id-here
VITE_AZURE_AD_REDIRECT_URI=http://localhost:3000

# CouchDB Configuration (Optional - for remote sync)
VITE_COUCHDB_URL=http://localhost:5984
VITE_COUCHDB_USERNAME=admin
VITE_COUCHDB_PASSWORD=password
VITE_COUCHDB_DB_NAME=blt_reports

# JIRA Configuration (Optional - for integration)
VITE_JIRA_URL=https://your-company.atlassian.net
VITE_JIRA_PROJECT_KEY=BUG
VITE_JIRA_API_TOKEN=your-api-token-here

# Background Agent (Optional - for auto log collection)
VITE_AGENT_URL=http://localhost:42080
VITE_AGENT_ENABLED=true

# Application Configuration
VITE_APP_VERSION=2.0.1
VITE_APP_NAME=Bug Logging Tool
```

### 2. Azure AD Setup

#### Step 1: Create App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in details:
   - **Name**: Bug Logging Tool (BLT)
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: 
     - Platform: Single-page application (SPA)
     - URI: `http://localhost:3000`
5. Click **Register**
6. Copy **Application (client) ID** → Use as `VITE_AZURE_AD_CLIENT_ID`
7. Copy **Directory (tenant) ID** → Use as `VITE_AZURE_AD_TENANT_ID`

#### Step 2: Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - `User.Read`
   - `profile`
   - `openid`
   - `email`
6. Click **Add permissions**
7. Click **Grant admin consent** (if you have admin rights)

#### Step 3: Configure Authentication

1. Go to **Authentication**
2. Under **Implicit grant and hybrid flows**, enable:
   - ✅ Access tokens
   - ✅ ID tokens
3. Under **Advanced settings**:
   - Allow public client flows: **No**
4. Click **Save**

#### Step 4: Create App Roles (for RBAC)

1. Go to **App roles**
2. Click **Create app role**

**Create 4 roles:**

**Role 1: User**
```
Display name: User
Allowed member types: Users/Groups
Value: User
Description: Standard user who can create and view their own bug reports
```

**Role 2: PowerUser**
```
Display name: PowerUser
Allowed member types: Users/Groups
Value: PowerUser
Description: Power user with additional features like bulk operations and advanced search
```

**Role 3: ITSupport**
```
Display name: ITSupport
Allowed member types: Users/Groups
Value: ITSupport
Description: IT support staff who can view and manage all bug reports
```

**Role 4: Admin**
```
Display name: Admin
Allowed member types: Users/Groups
Value: Admin
Description: Administrator with full access to all features and settings
```

#### Step 5: Assign Users to Roles

1. Go to **Enterprise applications**
2. Find "Bug Logging Tool (BLT)"
3. Click **Users and groups**
4. Click **Add user/group**
5. Select user(s) and assign appropriate role
6. Click **Assign**

### 3. CouchDB Setup (Optional)

#### Using Docker (Recommended):

```bash
# Pull CouchDB image
docker pull couchdb:3

# Run CouchDB container
docker run -d \
  --name blt-couchdb \
  -p 5984:5984 \
  -e COUCHDB_USER=admin \
  -e COUCHDB_PASSWORD=password \
  -v couchdb-data:/opt/couchdb/data \
  couchdb:3
```

#### Manual Installation:

1. Download CouchDB from [https://couchdb.apache.org/](https://couchdb.apache.org/)
2. Install and start CouchDB
3. Open Fauxton (CouchDB UI): [http://localhost:5984/_utils](http://localhost:5984/_utils)
4. Create database: `blt_reports`
5. Enable CORS:
   ```bash
   curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/httpd/enable_cors -d '"true"'
   curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/origins -d '"*"'
   curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/credentials -d '"true"'
   curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
   curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/headers -d '"accept, authorization, content-type, origin, referer"'
   ```

---

## 🎮 Usage

### Development Mode

```bash
# Start development server
npm run dev

# Open in browser
# Navigate to http://localhost:3000
```

The app will:
- Hot-reload on file changes
- Show detailed error messages
- Enable React DevTools
- Use development Azure AD settings

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Desktop Application

```bash
# Build Electron app
npm run electron:build

# Development mode (Electron + hot reload)
npm run electron:dev
```

**Desktop builds will be in `dist-electron/` directory:**
- Windows: `.exe` installer
- macOS: `.dmg` installer
- Linux: `.AppImage` or `.deb`

### First-Time Setup Checklist

After installation, complete these steps:

- [ ] Configure `.env` file with Azure AD credentials
- [ ] Test Azure AD login
- [ ] Verify CouchDB connection (if using remote sync)
- [ ] Assign user roles in Azure AD
- [ ] Test report creation
- [ ] Test screenshot capture
- [ ] Test log file collection
- [ ] Install PWA (optional)
- [ ] Install desktop app (optional)
- [ ] Configure background agent (optional)

---

## 🔐 Role-Based Access Control

### Role Definitions

| Role | Description | Capabilities |
|------|-------------|--------------|
| **User** | Standard user | Create reports, view own reports |
| **PowerUser** | Advanced user | User + export reports, delete reports |
| **ITSupport** | IT support staff | PowerUser + view all users' reports, IT tools |
| **Admin** | Administrator | ITSupport + clear all reports, system management |

### Feature Permissions Matrix

| Feature | User | PowerUser | ITSupport | Admin |
|---------|:----:|:---------:|:---------:|:-----:|
| Create report | ✅ | ✅ | ✅ | ✅ |
| View own reports | ✅ | ✅ | ✅ | ✅ |
| Edit own report | ✅ | ✅ | ✅ | ✅ |
| Delete own report | ❌ | ✅ | ✅ | ✅ |
| View all reports | ❌ | ❌ | ✅ | ✅ |
| Export reports | ❌ | ✅ | ✅ | ✅ |
| Bulk operations | ❌ | ✅ | ✅ | ✅ |
| Clear all reports | ❌ | ❌ | ❌ | ✅ |
| System settings | ❌ | ❌ | ❌ | ✅ |

### Testing Roles

1. **User Role**:
   - Buttons show 🔒 lock icons
   - Export/Delete disabled
   - No "All Reports" tab

2. **PowerUser Role**:
   - Export button enabled
   - Delete button enabled
   - Still only see own reports

3. **ITSupport Role**:
   - "All Reports" tab visible
   - Can toggle between own/all reports
   - See all users' email addresses

4. **Admin Role**:
   - All features enabled
   - "Clear All" button unlocked
   - Full system access

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Azure AD Login Fails

**Problem**: "AADSTS50011: The reply URL specified does not match"

**Solution**:
```bash
# Check redirect URI in .env matches Azure AD
VITE_AZURE_AD_REDIRECT_URI=http://localhost:3000

# In Azure Portal, verify redirect URI is exactly:
# http://localhost:3000 (no trailing slash!)
```

#### 2. Service Worker Not Updating

**Problem**: Changes not reflecting in PWA

**Solution**:
```bash
# Clear cache and refresh
# Chrome: DevTools > Application > Clear Storage > Clear site data

# Or force update in code
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister()
    }
  })
}
```

#### 3. CouchDB Sync Not Working

**Problem**: "Sync paused" or "Sync error"

**Solution**:
```bash
# Check CORS settings
curl http://localhost:5984/_node/_local/_config/httpd/enable_cors
# Should return: "true"

# Check CouchDB is running
curl http://localhost:5984/
# Should return CouchDB version info

# Verify database exists
curl http://admin:password@localhost:5984/blt_reports
# Should return database info, not 404
```