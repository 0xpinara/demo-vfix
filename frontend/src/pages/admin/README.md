# Admin Dashboard Pages

This folder contains the admin dashboard pages for the V-Fix platform.

## Access

- Login with username: `admin` and password: `admin`
- Admins are redirected to `/admin` after login

## Pages

### 1. General Statistics (`/admin`)
- **File**: `GeneralStatistics.jsx`
- **Purpose**: Main dashboard showing overall platform statistics
- **Features**:
  - Total chats, users, technicians count
  - Average user and technician ratings (star display)
  - Half-circle progress indicators for:
    - Problems solved percentage
    - Technician dispatch rate
    - Diagnosis accuracy (from technician feedback)
    - Parts recommendation accuracy

### 2. User Feedback (`/admin/user-feedback`)
- **File**: `UserFeedback.jsx`
- **Purpose**: View all user feedback on chatbot interactions
- **Features**:
  - Paginated list of user reviews
  - Star ratings and comments
  - Summary statistics (total feedback, average rating)

### 3. Technician Feedback (`/admin/technician-feedback`)
- **File**: `TechnicianFeedback.jsx`
- **Purpose**: Placeholder for technician feedback module
- **Status**: Under development by another team member
- **Planned Features**:
  - Technician ratings and comments
  - Diagnosis accuracy tracking
  - Parts sufficiency feedback
  - Second trip rate

### 4. Improvement Data (`/admin/improvement-data`)
- **File**: `ImprovementData.jsx`
- **Purpose**: Training data from incorrect AI diagnoses
- **Features**:
  - Problem/reason/solution documentation
  - Field trip requirement tracking
  - Parts requirement tracking
  - Training status (used/pending)
  - Filter for unused training data

## Components

Located in `src/components/admin/`:

- **AdminLayout**: Main layout with sidebar navigation
- **StatCard**: Metric display cards
- **HalfCircleProgress**: Semi-circular progress indicators
- **StarRating**: Star rating display component

## API Endpoints

All admin endpoints require authentication and admin role:

- `GET /api/admin/statistics` - General statistics
- `GET /api/admin/user-feedback` - Paginated user feedback
- `GET /api/admin/technician-feedback` - Paginated technician feedback
- `GET /api/admin/improvement-data` - Training improvement data

## Seeding Test Data

Run the seed script to populate dummy data:

```bash
cd backend
python -m app.database.seed_admin_data
```

