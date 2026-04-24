import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

import auth as auth_utils
from database import get_db
from models import Project, User
from schemas import ProjectCreate, ProjectOut, ProjectUpdate

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _get_owned_project(project_id: int, user: User, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.owner_id != user.id and not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return project


@router.get("/", response_model=List[ProjectOut])
def list_projects(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    query = db.query(Project)
    if not current_user.is_admin:
        query = query.filter(Project.owner_id == current_user.id)
    projects = query.offset(skip).limit(limit).all()
    return [_project_out(p) for p in projects]


@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    project = Project(
        name=payload.name,
        description=payload.description,
        data=json.dumps(payload.data),
        is_public=payload.is_public,
        owner_id=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _project_out(project)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    project = _get_owned_project(project_id, current_user, db)
    return _project_out(project)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    project = _get_owned_project(project_id, current_user, db)
    update_data = payload.model_dump(exclude_none=True)
    if "data" in update_data:
        update_data["data"] = json.dumps(update_data["data"])
    for field, value in update_data.items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return _project_out(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    project = _get_owned_project(project_id, current_user, db)
    db.delete(project)
    db.commit()


@router.get("/{project_id}/export")
def export_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    project = _get_owned_project(project_id, current_user, db)
    export_payload = {
        "name": project.name,
        "description": project.description,
        "data": json.loads(project.data or "{}"),
        "is_public": project.is_public,
        "exported_at": str(project.updated_at or project.created_at),
    }
    return JSONResponse(content=export_payload, media_type="application/json")


@router.post("/import", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def import_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    # Reuse create – the client sends the exported JSON as ProjectCreate body
    return create_project(payload, db, current_user)


# ---------------------------------------------------------------------------
# Internal helper – parse JSON data field
# ---------------------------------------------------------------------------

def _project_out(project: Project) -> ProjectOut:
    try:
        data = json.loads(project.data) if project.data else {}
    except (ValueError, TypeError):
        data = {}
    return ProjectOut(
        id=project.id,
        name=project.name,
        description=project.description or "",
        data=data,
        thumbnail_url=project.thumbnail_url,
        owner_id=project.owner_id,
        is_public=project.is_public,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )
