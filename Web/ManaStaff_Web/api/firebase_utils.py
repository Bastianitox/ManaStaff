from firebase_admin import db, storage

# === REALTIME DATABASE ===
def get_ref(path: str):
    """Obtiene referencia segura de la base de datos."""
    return db.reference(path)

def get_data(path: str):
    ref = get_ref(path)
    return ref.get()

def set_data(path: str, data: dict):
    ref = get_ref(path)
    ref.set(data)
    return {"status": "ok", "path": path}

def update_data(path: str, data: dict):
    ref = get_ref(path)
    ref.update(data)
    return {"status": "ok", "path": path}

def delete_data(path: str):
    ref = get_ref(path)
    ref.delete()
    return {"status": "deleted", "path": path}


# === STORAGE ===
def upload_file(file, path: str):
    bucket = storage.bucket()
    blob = bucket.blob(path)
    blob.upload_from_file(file)
    blob.make_public()
    return {"url": blob.public_url, "path": path}

def delete_file(path: str):
    bucket = storage.bucket()
    blob = bucket.blob(path)
    blob.delete()
    return {"status": "deleted", "path": path}
