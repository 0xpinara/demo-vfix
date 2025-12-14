# Enterprise Feature Documentation

## Overview
Enterprise account management with hierarchical structure: **Enterprises → Branches → Employees** with role-based access control.

## Database Structure

**New Tables:**
- `enterprises`: id, name, registration_number, contact_email, contact_phone, is_active
- `branches`: id, enterprise_id, name, address, phone, manager_id, is_active

**User Model Updates:**
- `enterprise_id` (FK to enterprises, nullable)
- `branch_id` (FK to branches, nullable) - **Required for technicians**
- `enterprise_role` (technician, senior_technician, branch_manager, enterprise_admin)
- `employee_id` (optional internal ID)

## Enterprise Roles (Hierarchical)

1. **enterprise_admin**: Full enterprise access, all branches, all employees
2. **branch_manager**: Branch-level access, manages branch employees
3. **senior_technician**: Appointments + mentoring in assigned branch
4. **technician**: Appointments only in assigned branch

**Validation**: Technicians must have `branch_id` assigned.

## Registration & Login

**Login**: `/login` (same for all users)
- Redirects: Enterprise users → `/chat`, Admin → `/admin`, Regular → `/chat`

**Registration**: 
- Regular: `/register` (existing)
- Enterprise: `/register/enterprise` (3-step form: Account → Enterprise/Branch → Role/Compliance)

## API Endpoints

- `POST /api/enterprise/register` - Register enterprise user

## RBAC Dependencies

- `require_enterprise_user()` - Must have enterprise_id
- `require_enterprise_admin()` - Must be enterprise_admin
- `require_branch_manager()` - Must be branch_manager or enterprise_admin
- `require_technician()` - Must be technician role or higher

## Test Users

**Seed Script**: `python -m app.database.seed_enterprise_users`
**Password**: `password123` for all test users

**Test Accounts** (10 users across 5 enterprises):
- 4 Technicians, 2 Senior Technicians, 2 Branch Managers, 2 Enterprise Admins
- Companies: Arçelik, Samsung, LG, Beyaz Eşya, Bosch
- Branches: İstanbul, Ankara, İzmir, Bursa, Antalya

## Key Files

**Backend**: `models/enterprise.py`, `routes/enterprise.py`, `services/enterprise_service.py`, `schemas/enterprise_schema.py`
**Frontend**: `pages/register/EnterpriseRegister.jsx`
**Migration**: `database/migrate_enterprise.py` (for existing databases)

## Implementation Scope

**Implemented**: Registration and login functionality only.
**Not Implemented**: Dashboard, employee management, branch management endpoints (reserved for future implementation).

