# FixNest Technical Stack & Architecture

This document provides a comprehensive breakdown of the technologies, frameworks, and libraries used to build FixNest, along with the reasoning behind these choices.

---

## 1. Frontend (Client-Side)
The frontend is designed to be highly responsive, modern, and accessible, prioritizing a "vibe-coded" aesthetic with rich micro-animations.

*   **Framework:** [Next.js 16](https://nextjs.org/) (React Framework)
    *   *Why:* Next.js provides App Router routing, server-side rendering (SSR), and seamless API integrations. It offers the fastest path to a production-ready React application.
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
    *   *Why:* Ensures type safety across the application, reducing runtime errors and improving developer experience through IDE autocomplete.
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
    *   *Why:* A utility-first CSS framework that allows for rapid UI development without writing custom CSS files. Enables beautiful, customized, and responsive design systems.
*   **Icons:** [Phosphor Icons](https://phosphoricons.com/) (`@phosphor-icons/react`)
    *   *Why:* A clean, modern, and highly legible icon family that matches the premium aesthetic required for FixNest.
*   **State Management & Reactivity:** React Hooks (`useState`, `useEffect`, `useRef`)
*   **Real-Time Sync:** Native Browser `EventSource` (Server-Sent Events)
    *   *Why:* Allows the frontend to receive real-time ticket updates and comments from the backend instantly without the overhead of WebSockets.

---

## 2. Backend (Server-Side)
The backend acts as the brain of FixNest, handling data persistence, running AI models in memory, and broadcasting real-time events to connected clients.

*   **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
    *   *Why:* FastAPI is incredibly fast, natively async, and automatically generates Swagger/OpenAPI documentation. It is the ideal choice for a Python-based backend running machine learning models.
*   **Real-Time Streaming:** `sse-starlette`
    *   *Why:* Integrates perfectly with FastAPI to broadcast Server-Sent Events (SSE) to frontend clients, enabling live multi-screen synchronization (e.g., ticket submissions instantly appearing on the Admin dashboard).
*   **ORM & Database Mapping:** [SQLAlchemy](https://www.sqlalchemy.org/)
    *   *Why:* The standard Object-Relational Mapper for Python. It allows us to define our database schema using Python classes (`models.py`) and interact with the database using object-oriented paradigms.
*   **Database:** [SQLite](https://sqlite.org/)
    *   *Why:* A lightweight, file-based database that requires zero configuration. It is perfect for local development and portable deployments without needing complex database servers (like PostgreSQL) or Docker containers.
*   **Data Validation:** [Pydantic](https://docs.pydantic.dev/)
    *   *Why:* Integrates with FastAPI to validate incoming JSON requests and format outgoing responses securely using type hints (`schemas.py`).

---

## 3. Artificial Intelligence & Machine Learning
FixNest features an "AI Triage Engine" that runs entirely locally within the Python environment, ensuring privacy and eliminating external API costs.

*   **Model Frameworks:** 
    *   [HuggingFace Transformers](https://huggingface.co/docs/transformers/index) (`transformers`)
    *   [SentenceTransformers](https://sbert.net/) (`sentence-transformers`)
*   **Zero-Shot Image Classification:** `openai/clip-vit-base-patch32`
    *   *Why:* A multi-modal model that understands both text and images. FixNest uses it to verify if an uploaded photo of a maintenance issue actually matches the resident's text description.
*   **Semantic Duplicate Detection:** `all-MiniLM-L6-v2`
    *   *Why:* A fast, lightweight SentenceTransformer model used to convert ticket descriptions into high-dimensional embeddings. We compute the Cosine Similarity between a new ticket and existing tickets to detect duplicates dynamically.
*   **Genuineness Classification:** [Scikit-Learn](https://scikit-learn.org/) (`scikit-learn`)
    *   *Why:* Used to train and run a lightweight Logistic Regression model. The model calculates the probability that a ticket is genuine vs. spam/invalid based on datasets from NYC 311, Fake Job Postings, and SMS Spam collections.
*   **Image Processing:** [Pillow](https://python-pillow.org/) (PIL)
    *   *Why:* Used to process and decode base64 images uploaded from the Next.js frontend before passing them into the CLIP model.

---

## 4. Geography & Vendor Validation
*   **Algorithm:** Haversine Formula
    *   *Why:* A mathematical formula used to calculate the great-circle distance between two points on a sphere. FixNest uses this purely in Python to verify if a Vendor's completion GPS coordinates match the originally reported issue coordinates within a 50-meter radius, acting as proof of work.
