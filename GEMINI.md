# EMS Frontend Standards & Instructions

## 🎯 Purpose
The EMS (Employee Management System) Frontend provides tools for managing workforce operations, including employee records, task tracking, meeting schedules, and performance monitoring.

## 🛠 Tech Stack
- **Framework**: Next.js 16 (App Router), React 19
- **Data Tables**: TanStack Table (@tanstack/react-table)
- **Charts**: Recharts
- **Database (Local/Proxy)**: Mongoose (used for specific data modeling/proxies)
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Validation**: React Hook Form, Zod

## 📂 Key Directories & Files
- `src/app/dashboard/`: Core modules like `employees`, `tasks`, `meetings`, `time-tracking`.
- `src/services/`: Direct API interaction logic for EMS features.
- `src/models/`: Local data structures and Mongoose schemas.
- `src/components/employees/`: specialized components for workforce management.

## 📐 Local Conventions
- **Form Handling**: Strictly use `react-hook-form` with `zod` for all employee and task inputs.
- **Service Layer**: Keep API logic in `src/services/` to separate it from UI components.
- **Port**: This application runs on port **3007**.

## 🔄 Specific Workflows
- **Development**: `npm run dev` (starts on port 3007).
- **API Integration**: Connects to the `ems-api` sub-service in `core-api`.

## 🔐 Environment Variables
- `NEXT_PUBLIC_EMS_API_URL`: URL for the EMS API service (default: http://localhost:3000/ems).
- `NEXT_PUBLIC_ENABLE_TIME_TRACKING`: Feature flag to toggle time-tracking modules.
- `NEXT_PUBLIC_DASHBOARD_REFRESH_INTERVAL`: Frequency for auto-updating dashboard stats.
