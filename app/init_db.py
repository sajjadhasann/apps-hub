import subprocess
import logging
import sys

# Configure basic logging to see the output in Render logs
logging.basicConfig(level=logging.INFO, stream=sys.stdout)

def run_migrations():
    """Runs Alembic to upgrade the database to the latest revision."""
    logging.info("--- Starting Alembic Migrations ---")
    
    try:
        # Run the alembic command. check=True ensures failure on error.
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            check=True, 
            capture_output=True,
            text=True
        )
        # Log Alembic's successful output
        logging.info("Alembic STDOUT:\n%s", result.stdout)
        logging.info("--- Database initialization successful ---")
    
    except subprocess.CalledProcessError as e:
        # Log detailed failure output
        logging.error("--- Alembic Migration FAILED ---")
        logging.error("Alembic STDERR: %s", e.stderr)
        # CRITICAL: Re-raise the exception to crash the parent process (Uvicorn startup)
        raise e
    
    except FileNotFoundError:
        logging.error("Alembic command not found. Ensure it is installed via requirements.txt.")
        raise

if __name__ == "__main__":
    run_migrations()