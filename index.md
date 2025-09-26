# SINCET Gate Entry System Documentation

This document provides a comprehensive overview of the SINCET Gate Entry System, a Flask-based web application designed to manage visitor and vehicle entries and exits for a college campus.

## 1. Project Overview

The system is a gate management tool for "SINCET" college. It allows gatekeepers to register visitors and vehicles, manage their entry and exit, and handle approval workflows for visitors who need permission from college authorities. It features a dashboard for real-time statistics and a reporting module.

## 2. Technologies Used

- **Backend:** Python with the [Flask](https://flask.palletsprojects.com/) web framework.
- **Database:** 
    - The application is configured to use **SQLite** (`sqlite:///gate_entry.db`) via **Flask-SQLAlchemy**.
    - The `db.create_all()` command in `app.py` automatically creates the schema based on the models.
    - The `.sql` files in the `/scripts` directory suggest that the application might have been originally designed for or used with **PostgreSQL**. These scripts are not directly used by the Flask application in its current configuration but are useful for understanding the intended database structure.
- **Frontend:**
    - **HTML5** with **Jinja2** for templating.
    - **Bootstrap 5** for styling and UI components.
    - **JavaScript** for dynamic frontend functionality, including AJAX calls to the backend API.
- **Dependencies:** Key Python libraries are listed in `requirements.txt` and include Flask, Flask-SQLAlchemy, Werkzeug for security, and others.

## 3. Project Structure

The project is organized into the following key directories and files:

- **`app.py`**: The main entry point of the Flask application. It initializes the Flask app, extensions (like SQLAlchemy), registers the blueprints (routes), and creates the database tables. It also defines the main index route (`/`) and creates a default admin user on first run.

- **`config.py`**: Contains all the application's configuration, such as the secret key, database URI (`SQLALCHEMY_DATABASE_URI`), and upload folder settings.

- **`models.py`**: Defines the database schema using SQLAlchemy ORM. The main models are:
    - `User`: For application users (gatekeepers, admins).
    - `Authority`: For college staff who can approve visitor entries (e.g., HOD, Principal).
    - `Visitor`: For tracking visitor details, entry/exit times, photos, and approval status.
    - `BusEntry`: For tracking vehicle and bus entries.
    - `Notification`: For notifying authorities about pending visitor requests.

- **`/routes/`**: This directory contains Flask Blueprints to modularize the application.
    - `auth.py`: Handles user authentication (login, signup, logout).
    - `visitor.py`: Manages all visitor-related actions (entry, exit, photo uploads).
    - `vehicle.py`: Manages vehicle and bus entry/exit.
    - `authority.py`: Handles management of authorities and the visitor approval workflow.
    - `dashboard.py`: Powers the statistics dashboard and reporting pages.
    - `api.py`: Provides a simple REST API used by the frontend JavaScript to fetch data dynamically (e.g., for live dashboard stats, search results).

- **`/templates/`**: Contains all Jinja2 HTML templates.
    - `base.html`: The main layout template that other pages extend.
    - `index.html`: The main menu/dashboard shown after a user logs in.
    - Subdirectories (`/auth`, `/visitor`, etc.) contain templates specific to each module.
    - `/components/`: Contains reusable modal templates for the camera and speech input.

- **`/static/`**: Stores all static assets.
    - `css/style.css`: Custom stylesheets.
    - `js/app.js`: Frontend JavaScript for features like camera capture, speech recognition, and dynamic data fetching for the dashboard.
    - `uploads/`: The directory where visitor photos are saved.

- **`/scripts/`**: Contains `.sql` files for database schema creation and data seeding. These are likely for a PostgreSQL setup and are not used by the current SQLite configuration.

- **`utils.py`**: A utility module containing helper functions, primarily for handling file uploads and checking for allowed file extensions.

## 4. How It Works

### a. Authentication and Roles
- Users can sign up for an account and log in.
- The system has three roles: `user` (gatekeeper), `authority`, and `admin`.
- A default **admin** user is created with credentials `admin` / `admin123` if one doesn't exist.
- Access to different features is restricted based on the user's role.

### b. Visitor Management
1.  A gatekeeper fills out the visitor entry form with details like name, phone, and purpose of visit.
2.  The system allows capturing a visitor's photo using the device's webcam or uploading an image file. This is handled by the JavaScript in `static/js/app.js`.
3.  If the visitor needs permission from a specific authority, the gatekeeper selects the authority from a dropdown.
4.  Upon submission:
    - If no authority is required, the visitor's status is set to `approved`.
    - If an authority is selected, the visitor's status is set to `pending`, and a `Notification` is created for that authority.
5.  Authorities can view pending requests in their panel and `approve` or `reject` them.
6.  The exit of a visitor is recorded, which updates their `exit_time` and sets their status to `exited`.

### c. Vehicle Management
- The system tracks the entry and exit of general vehicles and college buses separately.
- It records the vehicle number, driver details, route, and passenger count.
- The status is `entered` until the vehicle is marked as `exited`.

### d. Dashboard and API
- The dashboard (`/dashboard`) provides a real-time overview of gate activity (e.g., today's visitor count, active vehicles).
- The stats on the dashboard are refreshed automatically every 30 seconds using an AJAX call to the `/api/stats` endpoint defined in `routes/api.py`.
- The reports section allows generating and exporting visitor and vehicle data for custom date ranges.

## 5. How to Run the Project

1.  **Install Dependencies:**
    ```bash
    # Using uv (as per user preference)
    uv pip install -r requirements.txt
    ```

2.  **Run the Application:**
    ```bash
    python app.py
    ```

3.  **Access the System:**
    - Open a web browser and go to `http://127.0.0.1:5000`.
    - The application runs in debug mode, which provides detailed error messages and auto-reloads on code changes.

4.  **Default Login:**
    - **Username:** `admin`
    - **Password:** `admin123`
