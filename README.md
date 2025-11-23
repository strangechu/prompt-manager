# Prompt Manager

A simple and elegant tool to manage and assemble image generation prompts.

## Features

- **Prompt Registration**: Save prompts with Name, Type (Character, Pose, Scene), Content, and an optional Preview Image.
- **Prompt Assembly**: Select multiple prompts to combine them into a single string for easy copying.
- **Search**: Filter prompts by name or content.
- **Edit/Delete**: Manage your existing prompts.

## Tech Stack

- **Backend**: Python (Flask), SQLAlchemy (SQLite)
- **Frontend**: HTML, Tailwind CSS (CDN), JavaScript

## Installation & Setup

1.  **Clone/Download** the repository.
2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Run the Application**:
    ```bash
    python app.py
    ```
4.  **Access**: Open your browser and go to `http://127.0.0.1:5000`.

## Usage Guide

1.  **Add a Prompt**: Click the "+ Add Prompt" button in the top right. Fill in the details and upload an image if desired.
2.  **Assemble Prompts**: Click on the cards in the dashboard to select them. They will appear in the "Prompt Assembly" panel on the right.
3.  **Copy**: Click "Copy to Clipboard" to get your combined prompt string.
4.  **Search**: Use the search bar to find specific prompts.

## Future Improvements

- Add tags/categories management.
- Implement drag-and-drop for reordering selected prompts.
- Add user authentication.
