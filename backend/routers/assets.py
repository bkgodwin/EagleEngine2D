import mimetypes
import uuid
from pathlib import Path
from typing import List, Optional

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

import auth as auth_utils
from config import ALL_ALLOWED_EXTENSIONS, ALLOWED_ASSET_EXTENSIONS, UPLOADS_DIR
from database import get_db
from models import Asset, AssetTypeEnum, SystemSettings, User
from schemas import AssetOut

router = APIRouter(prefix="/api/assets", tags=["assets"])


def _classify_asset(extension: str) -> AssetTypeEnum:
    ext = extension.lower()
    for kind, exts in ALLOWED_ASSET_EXTENSIONS.items():
        if ext in exts:
            return AssetTypeEnum(kind)
    return AssetTypeEnum.other


def _asset_out(asset: Asset) -> AssetOut:
    return AssetOut(
        id=asset.id,
        filename=asset.filename,
        stored_filename=asset.stored_filename,
        asset_type=asset.asset_type.value if hasattr(asset.asset_type, "value") else asset.asset_type,
        mime_type=asset.mime_type,
        size_bytes=asset.size_bytes,
        owner_id=asset.owner_id,
        created_at=asset.created_at,
    )


@router.post("/upload", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
async def upload_asset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    settings = db.query(SystemSettings).first()

    # Extension check
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALL_ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{suffix}' is not allowed",
        )

    # Read file content into memory to get size
    content = await file.read()
    file_size = len(content)

    # Per-file size limit
    if settings and file_size > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.max_upload_size_bytes} bytes",
        )

    # Storage quota check
    if current_user.storage_used + file_size > current_user.storage_quota:
        raise HTTPException(
            status_code=status.HTTP_507_INSUFFICIENT_STORAGE,
            detail="Storage quota exceeded",
        )

    # Build a unique on-disk filename to avoid collisions
    stored_filename = f"{uuid.uuid4().hex}{suffix}"
    dest_path = UPLOADS_DIR / stored_filename

    async with aiofiles.open(dest_path, "wb") as out_file:
        await out_file.write(content)

    mime_type, _ = mimetypes.guess_type(file.filename)
    asset = Asset(
        filename=file.filename,
        stored_filename=stored_filename,
        asset_type=_classify_asset(suffix),
        mime_type=mime_type,
        size_bytes=file_size,
        owner_id=current_user.id,
    )
    db.add(asset)
    current_user.storage_used += file_size
    db.commit()
    db.refresh(asset)
    return _asset_out(asset)


@router.get("/", response_model=List[AssetOut])
def list_assets(
    skip: int = 0,
    limit: int = 100,
    asset_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    query = db.query(Asset)
    if not current_user.is_admin:
        query = query.filter(Asset.owner_id == current_user.id)
    if asset_type:
        query = query.filter(Asset.asset_type == asset_type)
    return [_asset_out(a) for a in query.offset(skip).limit(limit).all()]


@router.get("/{asset_id}", response_model=AssetOut)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    if asset.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return _asset_out(asset)


@router.get("/{asset_id}/download")
def download_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    if asset.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    file_path = UPLOADS_DIR / asset.stored_filename
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk")

    return FileResponse(path=str(file_path), filename=asset.filename, media_type=asset.mime_type)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    if asset.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Remove file from disk
    file_path = UPLOADS_DIR / asset.stored_filename
    if file_path.exists():
        file_path.unlink()

    current_user.storage_used = max(0, current_user.storage_used - asset.size_bytes)
    db.delete(asset)
    db.commit()
