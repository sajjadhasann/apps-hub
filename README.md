# Enterprise Application Hub (Technical Assessment)

## 🌟 Project Overview

This repository contains the solution for a 3-Day Technical Assessment for an **Enterprise Solutions Developer** role. The project is a full-stack **Enterprise Application Hub** built using **Python (FastAPI)** and **PostgreSQL**.

The system is designed to manage internal applications, user access, and support tickets, focusing on implementing robust authentication and access control mechanisms as required by the assessment.

**View and test the LIVE version: *https://apps-hub.onrender.com***

### Key Deliverables:

- **Secure Authentication:** Web login/register (Email + Password) and JWT-based API authentication.
- **Data Persistence:** Mandatory use of the **PostgreSQL** database.
- **Role-Based Access Control (RBAC):** Implementing distinct permissions for **Admin** and **User** roles.
- **Data Management (CRUD):** Full management modules for Applications, Users, and Tickets.
- **External Integration:** Consumption of one external REST API (Gemini Chatbot).

---

## 🏗️ Technical Stack

| Category | Technology | Purpose |
| --- | --- | --- |
| **Backend Framework** | Python / **FastAPI** | High-performance API and server logic. |
| **Database** | **PostgreSQL** | Mandatory robust relational database. |
| **ORM & Migrations** | **SQLAlchemy** & **Alembic** | Data modeling and database version control. |
| **Authentication** | **JWT**, `python-jose`, `passlib[bcrypt]` | Secure password hashing and token-based access. |
| **Templating** | **Jinja2** | Rendering dynamic HTML pages (UI). |
| **Configuration** | **Pydantic Settings** | Environment variable management (`.env`). |

---

## 🗂️ Project Architecture

The project follows a clean, **Layered Architecture** for scalability and maintainability, ensuring clear **separation of concerns** among API layers, core services (business logic), database logic, and frontend assets.

```jsx
fastapi-enterprise/
│
├── app/
│   ├── main.py             # FastAPI entry point, includes main routers
│   │
│   ├── core/
│   │   ├── config.py       # Pydantic settings configuration management
│   │   └── security.py     # Password hashing and JWT utility functions
│   │
│   ├── db/
│   │   ├── base.py         # Base class for all SQLAlchemy models
│   │   └── models/
│   │       ├── user.py         # User model (full_name, email, role)
│   │       ├── application.py  # Application model (name, category, owner, status)
│   │       └── ticket.py       # Ticket model (title, description, FKs)
│   │
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py         # Login, register, and JWT endpoints
│   │       ├── users.py        # User and UserApplicationAccess management
│   │       ├── applications.py # Application CRUD routes
│   │       └── tickets.py      # Ticket CRUD routes
│   │
│   ├── schemas/            # Pydantic schemas for request/response validation
│   │   ├── user.py
│   │   ├── application.py
│   │   └── ticket.py
│   │
│   ├── services/
│   │   └── weather_service.py # Logic for external REST API integration (Day 3)
│   │
│   ├── templates/          # Jinja2 HTML templates for the Web UI
│   │   ├── login.html
│   │   └── dashboard.html
│   │
│   └── static/             # Frontend assets (CSS/JS)
│       ├── css/
│       └── js/
│
├── .env                    # Environment variables file
├── alembic.ini             # Alembic configuration file
└── requirements.txt        # List of all required Python packages
```

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### 1. Prerequisites

Ensure the following tools are installed on your machine:

* **Python 3.9+**
* **PostgreSQL** database server
* **Git**

### 2. Project Setup

Clone the repository
```bash
git clone https://github.com/sajjadhasann/apps-hub.git
cd apps-hub
```

Create the Virtual Environment
```bash
python -m venv venv
```
Activate the Virtual Environment on Windows
```bash
venv\Scripts\activate
```
Activate the Virtual Environment on macOS/Linux
```bash
source venv/bin/activate
```

### 3. Install Dependencies

Install all required Python packages listed in the `requirements.txt` file:

```bash
pip install -r requirements.txt
```

### 4. Database Configuration (PostgreSQL)

You must configure the **PostgreSQL** database before running migrations.

| **Setting** | **Value** | **Notes** |
| --- | --- | --- |
| **User** | `postgres` (Assumed Default) |  |
| **Password** | `admin` | Provided in configuration. |
| **Port** | `5432` | Standard PostgreSQL port. |
| **Database Name** | `internal_applications_portal` | The target database name. |

**Action:** Create the database using your preferred tool (pgAdmin, DBeaver, or psql) or run this line in CLI:

```Bash
python -m app.init_db  
```

### 5. Environment Variables (`.env`)

Create a file named **`.env`** in the project root directory and populate it with your configuration details.

--- Database Configuration ---
`Format: postgresql://USER:PASSWORD@HOST:PORT/DB_NAME`
```Bash
DATABASE_URL=postgresql://postgres:admin@localhost:5432/internal_applications_portal
```

--- JWT Settings ---
```Bash
JWT_SECRET_KEY=YOUR_SUPER_SECRET_KEY_HERE # MUST BE CHANGED FOR PRODUCTION
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

--- External API Integration ---
```Bash
WEATHER_API_KEY=your_external_api_key_here
```

---

## ⚙️ Database Migrations (Alembic)

**Alembic** is configured for database schema version control.

### 1. Alembic Setup

Alembic is initialized in the `app/db/migrations` directory. Ensure the configuration files correctly reference the base models and the database URL from the `.env` file.

### 2. Run Initial Migration

After defining your SQLAlchemy models (`User`, `Application`, `Ticket`), execute the following commands to create the tables in your PostgreSQL database:

```Bash
# Automatically generate the initial migration script
alembic revision --autogenerate -m "initial migration: core models setup"

# Apply the migration to the database
alembic upgrade head`
```

### 3. Subsequent Migrations

Whenever you modify any model (e.g., adding a column), run the two commands again:

```Bash
alembic revision --autogenerate -m "descriptive message about changes"
alembic upgrade head
```

---

## 🟢 Running the Application

Start the **FastAPI** application using Uvicorn:

```Bash
uvicorn app.main:app --reload
```

The application will be accessible at: **http://127.0.0.1:8000**