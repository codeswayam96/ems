# EMS Frontend - Employee Management System

## Overview

**EMS Frontend** is a comprehensive Employee Management System that provides organizations with powerful tools to manage their workforce. It offers employee management, task tracking, meeting scheduling, time tracking, and performance monitoring. Built with **Next.js** and modern UI libraries, it delivers an intuitive and responsive experience for HR managers and employees.

---

## 🎯 Key Features

- **Dashboard**: Overview of key metrics and recent activities
- **Employee Management**: View and manage team members, roles, and statuses
- **Task Management**: Create, track, and manage project tasks with priority levels
- **Meeting Scheduling**: Schedule and manage team meetings
- **Time Tracking**: Monitor and approve employee time entries
- **Performance Tracking**: Track employee performance and reviews
- **Attendance**: Monitor attendance records
- **Reports**: Generate HR and performance reports
- **Settings**: User account and application preferences
- **Responsive Design**: Works on desktop and mobile devices

---

## 🛠️ Tech Stack

### Frontend Framework
- **Framework**: Next.js 16.x (React 19.x)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI, shadcn/ui, @codeswayam/ui

### Data Management
- **Data Fetching**: Axios
- **Data Tables**: @tanstack/react-table
- **Forms**: React Hook Form
- **Charts**: Recharts

### Key Libraries
- **Toast Notifications**: Sonner
- **Icons**: Lucide React
- **UI Components**: Radix UI
- **Utilities**: clsx, tailwind-merge

---

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v11.6.2+
- **EMS API**: Backend EMS service running

---

## 🔧 Installation & Setup

### 1. Install Dependencies

```bash
# From root directory
npm install

# Or from ems-frontend directory
cd apps/ems-frontend
npm install
```

### 2. Environment Variables

Create `.env.local` file in the `apps/ems-frontend` directory:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_EMS_API_URL=http://localhost:3000/ems
NEXT_PUBLIC_API_TIMEOUT=10000

# Feature Flags
NEXT_PUBLIC_ENABLE_TIME_TRACKING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_TRACKING=true
NEXT_PUBLIC_ENABLE_REPORTS=true

# Dashboard Configuration
NEXT_PUBLIC_DASHBOARD_REFRESH_INTERVAL=30000  # 30 seconds
```

---

## 🚀 Running the Application

### Development Mode

```bash
# Start development server
npm run dev

# Access at http://localhost:3007
```

### Build for Production

```bash
# Create optimized build
npm run build

# Test production build locally
npm run start

# Access at http://localhost:3007
```

---

## 📁 Project Structure

```
apps/ems-frontend/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Dashboard home
│   ├── globals.css             # Global styles
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Main dashboard
│   │   ├── analytics/          # Analytics pages
│   │   ├── employees/          # Employee management
│   │   ├── tasks/              # Task management
│   │   ├── meetings/           # Meeting scheduling
│   │   ├── time-tracking/      # Time tracking
│   │   ├── attendance/         # Attendance tracking
│   │   ├── performance/        # Performance reviews
│   │   ├── reports/            # Reports section
│   │   └── settings/           # User settings
│   └── api/                    # API routes
├── components/
│   ├── layout/
│   │   ├── header.tsx          # Top header
│   │   ├── sidebar.tsx         # Side navigation
│   │   └── footer.tsx
│   ├── dashboard/
│   │   ├── stats-card.tsx      # Statistics cards
│   │   ├── charts.tsx          # Chart components
│   │   └── summary.tsx
│   ├── employees/
│   │   ├── employee-table.tsx  # Employee data table
│   │   ├── employee-form.tsx   # Employee edit form
│   │   └── employee-dialog.tsx
│   ├── tasks/
│   │   ├── task-list.tsx
│   │   ├── task-form.tsx
│   │   └── task-dialog.tsx
│   ├── common/                 # Reusable components
│   └── ui/                     # UI primitives
├── lib/
│   ├── api.ts                  # EMS API client
│   ├── hooks/                  # Custom hooks
│   ├── utils.ts                # Utilities
│   └── constants.ts            # Constants
├── public/
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start dev server at port 3007
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

---

## 📊 Dashboard Features

### Main Dashboard
- **Key Metrics**: Active employees, tasks pending, meetings scheduled
- **Charts**: Employee distribution, task completion trends
- **Recent Activities**: Latest system events
- **Quick Actions**: Common HR tasks

### Employee Management
- **Employee List**: Paginated table with sorting/filtering
- **Employee Details**: View complete employee information
- **Edit Employee**: Update employee information
- **Role Management**: Modify employee roles
- **Department View**: View by department
- **Employee Search**: Search by name, email, ID

### Task Management
- **Task List**: View all tasks
- **Create Task**: Assign tasks to employees
- **Priority Levels**: Set task priorities
- **Status Tracking**: Track task progress
- **Deadline Management**: Monitor deadlines
- **Task Analytics**: Task completion stats

### Meeting Scheduling
- **Calendar View**: Visual meeting schedule
- **Create Meeting**: Schedule new meetings
- **Attendees**: Manage attendee list
- **Notifications**: Meeting reminders
- **Meeting Details**: Location, time, agenda
- **RSVP Tracking**: Track attendee responses

### Time Tracking
- **Clock In/Out**: Employee time entry
- **Timesheet**: View timesheet data
- **Approval Workflow**: Manager approval
- **Overtime**: Track overtime hours
- **Reports**: Time analytics
- **Export**: Download time data

### Attendance Tracking
- **Attendance List**: Employee attendance records
- **Punch Records**: In/Out timestamps
- **Leave Requests**: Manage leave applications
- **Attendance Report**: Generate attendance reports
- **Trends**: Attendance patterns

### Performance Reviews
- **Review List**: All performance reviews
- **Create Review**: New performance evaluation
- **Rating System**: Performance ratings
- **Comments**: Review feedback
- **History**: Past reviews
- **Improvement Plans**: Track improvements

### Reports
- **Employee Reports**: Employee data exports
- **Performance Reports**: Performance analytics
- **Attendance Reports**: Attendance summary
- **Custom Reports**: Create custom reports
- **Export Options**: CSV, PDF, Excel
- **Scheduling**: Schedule report generation

---

## 🔌 API Integration

### Employee Endpoints
- `GET /ems/employees` - List employees
- `POST /ems/employees` - Create employee
- `GET /ems/employees/:id` - Get employee details
- `PATCH /ems/employees/:id` - Update employee
- `DELETE /ems/employees/:id` - Delete employee

### Task Endpoints
- `GET /ems/tasks` - List tasks
- `POST /ems/tasks` - Create task
- `PATCH /ems/tasks/:id` - Update task
- `DELETE /ems/tasks/:id` - Delete task

### Time Tracking Endpoints
- `POST /ems/time-tracking/clock-in` - Clock in
- `POST /ems/time-tracking/clock-out` - Clock out
- `GET /ems/time-tracking/timesheet` - Get timesheet
- `PATCH /ems/time-tracking/:id/approve` - Approve timesheet

### Meeting Endpoints
- `GET /ems/meetings` - List meetings
- `POST /ems/meetings` - Create meeting
- `PATCH /ems/meetings/:id` - Update meeting
- `DELETE /ems/meetings/:id` - Delete meeting

---

## 📊 Data Tables

### Employee Table
Display: ID, Name, Email, Department, Role, Status, Actions

### Task Table
Display: ID, Title, Assigned To, Priority, Status, Deadline, Actions

### Time Tracking Table
Display: Date, Clock In, Clock Out, Hours, Status, Actions

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# E2E testing
npm run test:e2e
```

---

## 🌍 Deployment

### Deploy to Vercel
```bash
npm i -g vercel
vercel
```

### Production Setup
- Set production API URL
- Configure authentication
- Set up monitoring
- Configure email notifications

---

## 🤝 Contributing

### Code Standards
- Follow Next.js best practices
- Use TypeScript strictly
- Write accessible components
- Test thoroughly

---

## 🐛 Troubleshooting

### Data Not Loading
- Check API endpoint
- Verify network connection
- Check error logs in browser console
- Verify authentication

### Build Errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com)

---

## 📄 License

ISC License

---

**Last Updated**: April 2026

For more information, see the main [README.md](../../README.md)

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
```

### Environment Variables

```env
NEXT_PUBLIC_EMS_API_URL=http://localhost:4000
```

### Development

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:3003
```

### Build

```bash
# Build for production
npm run build

# Start the production server
npm start
```

## API Integration

The frontend connects to the EMS API (running on `http://localhost:4000` by default). The API client is configured in `src/lib/api-client.ts` with automatic token management and error handling.

### Available API Modules

- **Auth**: User authentication and authorization
- **Users**: User management endpoints
- **Tasks**: Task creation and management
- **Meetings**: Meeting scheduling and management
- **Tracking**: Time tracking and logging

## Project Structure

```
src/
├── app/
│   ├── dashboard/       # Dashboard page
│   ├── users/          # Users management page
│   ├── tasks/          # Tasks page
│   ├── meetings/       # Meetings page
│   ├── tracking/       # Time tracking page
│   ├── settings/       # Settings page
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page (redirects to dashboard)
│   └── globals.css     # Global styles
├── components/
│   ├── ui/            # shadcn/ui components
│   ├── Sidebar.tsx    # Navigation sidebar
│   └── layouts/       # Layout components
└── lib/
    ├── api-client.ts  # API client configuration
    └── utils.ts       # Utility functions
```

## Components

Built-in shadcn/ui components:
- Button
- Card
- Input
- Select
- Dialog
- Alert Dialog
- Tabs
- Dropdown Menu
- And more...

## Styling

The application uses Tailwind CSS for styling with custom theme variables defined in `src/app/globals.css`. Supports light and dark modes.

## Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced filtering and search
- [ ] Data export functionality
- [ ] Mobile app version
- [ ] Integrations with external tools
- [ ] Advanced reporting and analytics

## License

MIT
