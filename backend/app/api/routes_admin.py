from fastapi import APIRouter, BackgroundTasks

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/refresh")
def refresh_data(background_tasks: BackgroundTasks):
    from app.services.ingestion.pipeline import run_ingestion

    background_tasks.add_task(run_ingestion)
    return {"status": "refresh_started"}
