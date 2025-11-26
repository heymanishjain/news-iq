#!/bin/bash
# Script to run ingestion in the Docker backend container

echo "Running ingestion in Docker container..."
docker-compose exec backend python ingest.py

