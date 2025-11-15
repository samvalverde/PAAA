import boto3
from botocore.exceptions import ClientError
from app.core.config import get_settings

settings = get_settings()

def get_minio_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.minio_endpoint,
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
    )

def upload_file_to_minio(file, bucket_name: str, object_name: str):
    """Sube un archivo a MinIO usando boto3"""
    s3_client = get_minio_client()

    try:
        # Crear bucket si no existe
        existing_buckets = [b["Name"] for b in s3_client.list_buckets()["Buckets"]]
        if bucket_name not in existing_buckets:
            s3_client.create_bucket(Bucket=bucket_name)
        
        # FLAG
        print("Subiendo a:", bucket_name, object_name)

        # Subir el archivo
        s3_client.upload_fileobj(file.file, bucket_name, object_name)
        return {"status": "ok", "bucket": bucket_name, "object_name": object_name}

    except ClientError as e:
        print(f"Error al subir archivo a MinIO: {e}")
        return {"status": "error", "message": str(e)}

def download_file_from_minio(bucket_name: str, object_name: str):
    """Descarga un archivo de MinIO usando boto3"""
    s3_client = get_minio_client()

    try:
        # FLAG
        print("Descargando de:", bucket_name, object_name)

        response = s3_client.get_object(Bucket=bucket_name, Key=object_name)
        return response['Body'].read()

    except ClientError as e:
        print(f"Error al descargar archivo de MinIO: {e}")
        return None

def list_files_in_minio(bucket_name: str, prefix: str = ""):
    """Lista archivos en MinIO usando boto3"""
    s3_client = get_minio_client()

    try:
        # FLAG
        print("Listando archivos en:", bucket_name, "con prefijo:", prefix)

        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        
        if 'Contents' not in response:
            return []

        files = []
        for obj in response['Contents']:
            # Get object metadata for additional info
            try:
                meta_response = s3_client.head_object(Bucket=bucket_name, Key=obj['Key'])
                files.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'].isoformat(),
                    'etag': obj['ETag'].strip('"'),
                    'content_type': meta_response.get('ContentType', 'unknown')
                })
            except ClientError as meta_e:
                # If we can't get metadata, add basic info
                files.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'].isoformat(),
                    'etag': obj['ETag'].strip('"'),
                    'content_type': 'unknown'
                })

        return files

    except ClientError as e:
        print(f"Error al listar archivos en MinIO: {e}")
        return []