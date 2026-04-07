from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, File, UploadFile
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import bcrypt
import jwt
from google import genai
from google.genai import types
import logging
import uuid
import cloudinary
import cloudinary.uploader
import cloudinary.api

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

# Cloudinary configuration using STORAGE_URL
# Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
STORAGE_URL = os.environ.get('STORAGE_URL', '')
APP_NAME = os.environ.get('APP_NAME', 'freshtrack')

# Gemini AI configuration
GEMINI_API_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
gemini_client = None

def init_gemini():
    """Initialize Gemini AI using EMERGENT_LLM_KEY environment variable"""
    global gemini_client
    try:
        if GEMINI_API_KEY:
            gemini_client = genai.Client(api_key=GEMINI_API_KEY)
            logger.info("Gemini AI initialized successfully")
        else:
            logger.warning("EMERGENT_LLM_KEY not configured. Recipe generation will not work.")
    except Exception as e:
        logger.error(f"Gemini AI initialization failed: {e}")
        raise

def init_cloudinary():
    """Initialize Cloudinary using STORAGE_URL environment variable"""
    try:
        if STORAGE_URL:
            cloudinary.config(cloudinary_url=STORAGE_URL)
            logger.info("Cloudinary initialized successfully")
        else:
            logger.warning("STORAGE_URL not configured. File uploads will not work.")
    except Exception as e:
        logger.error(f"Cloudinary initialization failed: {e}")
        raise

def upload_to_cloudinary(file_content: bytes, filename: str, folder: str) -> dict:
    """
    Upload file to Cloudinary
    Returns: dict with 'secure_url', 'public_id', 'resource_type', 'format', 'bytes'
    """
    try:
        # Upload file to Cloudinary
        result = cloudinary.uploader.upload(
            file_content,
            folder=f"{APP_NAME}/{folder}",
            resource_type="auto",  # Auto-detect file type (image, raw, video)
            use_filename=True,
            unique_filename=True,
            overwrite=False
        )
        
        return {
            'secure_url': result['secure_url'],
            'public_id': result['public_id'],
            'resource_type': result.get('resource_type', 'raw'),
            'format': result.get('format', ''),
            'bytes': result.get('bytes', 0)
        }
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

def delete_from_cloudinary(public_id: str, resource_type: str = 'raw'):
    """Delete file from Cloudinary"""
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return result
    except Exception as e:
        logger.error(f"Cloudinary delete failed: {e}")
        # Don't raise exception on delete failure - log and continue

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        'sub': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(minutes=15),
        'type': 'access'
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        'sub': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=7),
        'type': 'refresh'
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get('access_token')
    if not token:
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail='Not authenticated')
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('type') != 'access':
            raise HTTPException(status_code=401, detail='Invalid token type')
        user = await db.users.find_one({'_id': ObjectId(payload['sub'])})
        if not user:
            raise HTTPException(status_code=401, detail='User not found')
        user['_id'] = str(user['_id'])
        user.pop('password_hash', None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: Optional[str] = 'user'

class InventoryItemRequest(BaseModel):
    name: str
    category: str
    quantity: float
    unit: str
    expiration_date: str

class InventoryItemResponse(BaseModel):
    id: str
    name: str
    category: str
    quantity: float
    unit: str
    expiration_date: str
    status: str
    user_id: str
    created_at: str
    updated_at: str

class ShoppingItemRequest(BaseModel):
    name: str
    category: str
    quantity: Optional[float] = 1
    unit: Optional[str] = 'unit'

class ShoppingItemResponse(BaseModel):
    id: str
    name: str
    category: str
    quantity: float
    unit: str
    purchased: bool
    user_id: str
    created_at: str

class RecipeRequest(BaseModel):
    ingredients: Optional[List[str]] = None

class RecipeResponse(BaseModel):
    recipe_name: str
    ingredients: List[str]
    instructions: str
    cooking_time: Optional[str] = None

class ShoppingSuggestionResponse(BaseModel):
    id: str
    name: str
    category: str
    quantity: float
    unit: str
    reason: str
    source_item_id: Optional[str] = None
    user_id: str
    created_at: str

class MyRecipeRequest(BaseModel):
    title: str
    description: Optional[str] = None
    ingredients: Optional[List[str]] = None
    instructions: Optional[str] = None

class MyRecipeResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    ingredients: Optional[List[str]] = None
    instructions: Optional[str] = None
    files: List[dict]
    user_id: str
    created_at: str
    updated_at: str

@api_router.post('/auth/register', response_model=UserResponse)
async def register(data: RegisterRequest, response: Response):
    email = data.email.lower()
    existing = await db.users.find_one({'email': email})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    
    user_doc = {
        'email': email,
        'password_hash': hash_password(data.password),
        'name': data.name,
        'role': 'user',
        'created_at': datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(
        key='access_token',
        value=access_token,
        httponly=True,
        secure=False,
        samesite='lax',
        max_age=900,
        path='/'
    )
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite='lax',
        max_age=604800,
        path='/'
    )
    
    return UserResponse(id=user_id, email=email, name=data.name, role='user')

@api_router.post('/auth/login', response_model=UserResponse)
async def login(data: LoginRequest, response: Response):
    email = data.email.lower()
    user = await db.users.find_one({'email': email})
    if not user or not verify_password(data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    user_id = str(user['_id'])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(
        key='access_token',
        value=access_token,
        httponly=True,
        secure=False,
        samesite='lax',
        max_age=900,
        path='/'
    )
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite='lax',
        max_age=604800,
        path='/'
    )
    
    return UserResponse(id=user_id, email=email, name=user['name'], role=user.get('role', 'user'))

@api_router.post('/auth/logout')
async def logout(response: Response):
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')
    return {'message': 'Logged out successfully'}

@api_router.get('/auth/me', response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(id=user['_id'], email=user['email'], name=user['name'], role=user.get('role', 'user'))

@api_router.post('/inventory', response_model=InventoryItemResponse)
async def create_inventory_item(data: InventoryItemRequest, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    expiry = datetime.fromisoformat(data.expiration_date.replace('Z', '+00:00'))
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    days_diff = (expiry - now).days
    
    if days_diff < 0:
        status = 'expired'
    elif days_diff <= 2:
        status = 'expiring'
    else:
        status = 'fresh'
    
    item_doc = {
        'name': data.name,
        'category': data.category,
        'quantity': data.quantity,
        'unit': data.unit,
        'expiration_date': data.expiration_date,
        'status': status,
        'user_id': user['_id'],
        'created_at': now.isoformat(),
        'updated_at': now.isoformat()
    }
    result = await db.inventory.insert_one(item_doc)
    
    await db.purchase_history.insert_one({
        'item_name': data.name,
        'category': data.category,
        'user_id': user['_id'],
        'purchased_at': now.isoformat()
    })
    
    return InventoryItemResponse(
        id=str(result.inserted_id),
        name=data.name,
        category=data.category,
        quantity=data.quantity,
        unit=data.unit,
        expiration_date=data.expiration_date,
        status=status,
        user_id=user['_id'],
        created_at=now.isoformat(),
        updated_at=now.isoformat()
    )

@api_router.get('/inventory', response_model=List[InventoryItemResponse])
async def get_inventory(user: dict = Depends(get_current_user)):
    items = await db.inventory.find({'user_id': user['_id']}).to_list(1000)
    
    now = datetime.now(timezone.utc)
    result = []
    for item in items:
        expiry = datetime.fromisoformat(item['expiration_date'].replace('Z', '+00:00'))
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        days_diff = (expiry - now).days
        
        if days_diff < 0:
            item['status'] = 'expired'
        elif days_diff <= 2:
            item['status'] = 'expiring'
        else:
            item['status'] = 'fresh'
        
        if item['quantity'] <= 0:
            item['status'] = 'expired'
        
        # Convert MongoDB _id to id for response
        item['id'] = str(item['_id'])
        item.pop('_id', None)
        
        result.append(InventoryItemResponse(**item))
    
    return result

@api_router.put('/inventory/{item_id}', response_model=InventoryItemResponse)
async def update_inventory_item(item_id: str, data: InventoryItemRequest, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    expiry = datetime.fromisoformat(data.expiration_date.replace('Z', '+00:00'))
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    days_diff = (expiry - now).days
    
    if days_diff < 0:
        status = 'expired'
    elif days_diff <= 2:
        status = 'expiring'
    else:
        status = 'fresh'
    
    if data.quantity <= 0:
        status = 'expired'
    
    update_doc = {
        'name': data.name,
        'category': data.category,
        'quantity': data.quantity,
        'unit': data.unit,
        'expiration_date': data.expiration_date,
        'status': status,
        'updated_at': now.isoformat()
    }
    
    result = await db.inventory.update_one(
        {'_id': ObjectId(item_id), 'user_id': user['_id']},
        {'$set': update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Item not found')
    
    return InventoryItemResponse(
        id=item_id,
        user_id=user['_id'],
        created_at=now.isoformat(),
        **update_doc
    )

@api_router.delete('/inventory/{item_id}')
async def delete_inventory_item(item_id: str, user: dict = Depends(get_current_user)):
    result = await db.inventory.delete_one({'_id': ObjectId(item_id), 'user_id': user['_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Item not found')
    return {'message': 'Item deleted successfully'}

@api_router.get('/shopping-list', response_model=List[ShoppingItemResponse])
async def get_shopping_list(user: dict = Depends(get_current_user)):
    items = await db.shopping_list.find({'user_id': user['_id']}, {'_id': 0}).to_list(1000)
    return [ShoppingItemResponse(**item) for item in items]

@api_router.post('/shopping-list', response_model=ShoppingItemResponse)
async def add_shopping_item(data: ShoppingItemRequest, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    item_doc = {
        'id': str(ObjectId()),
        'name': data.name,
        'category': data.category,
        'quantity': data.quantity,
        'unit': data.unit,
        'purchased': False,
        'user_id': user['_id'],
        'created_at': now.isoformat()
    }
    await db.shopping_list.insert_one(item_doc)
    return ShoppingItemResponse(**item_doc)

@api_router.put('/shopping-list/{item_id}/toggle')
async def toggle_shopping_item(item_id: str, user: dict = Depends(get_current_user)):
    item = await db.shopping_list.find_one({'id': item_id, 'user_id': user['_id']})
    if not item:
        raise HTTPException(status_code=404, detail='Item not found')
    
    new_status = not item['purchased']
    await db.shopping_list.update_one(
        {'id': item_id, 'user_id': user['_id']},
        {'$set': {'purchased': new_status}}
    )
    return {'purchased': new_status}

@api_router.delete('/shopping-list/{item_id}')
async def delete_shopping_item(item_id: str, user: dict = Depends(get_current_user)):
    result = await db.shopping_list.delete_one({'id': item_id, 'user_id': user['_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Item not found')
    return {'message': 'Item deleted successfully'}

@api_router.get('/analytics')
async def get_analytics(user: dict = Depends(get_current_user)):
    history = await db.purchase_history.find({'user_id': user['_id']}).to_list(1000)
    
    item_frequency = {}
    for purchase in history:
        item_name = purchase['item_name']
        item_frequency[item_name] = item_frequency.get(item_name, 0) + 1
    
    sorted_items = sorted(item_frequency.items(), key=lambda x: x[1], reverse=True)
    frequent_items = [{'name': name, 'count': count} for name, count in sorted_items[:10]]
    
    inventory_count = await db.inventory.count_documents({'user_id': user['_id']})
    shopping_count = await db.shopping_list.count_documents({'user_id': user['_id'], 'purchased': False})
    
    expiring_count = await db.inventory.count_documents({
        'user_id': user['_id'],
        'status': {'$in': ['expiring', 'expired']}
    })
    
    return {
        'frequent_items': frequent_items,
        'total_inventory': inventory_count,
        'shopping_list_count': shopping_count,
        'expiring_count': expiring_count
    }

@api_router.post('/recipes/generate', response_model=RecipeResponse)
async def generate_recipe(data: RecipeRequest, user: dict = Depends(get_current_user)):
    if data.ingredients:
        ingredients = data.ingredients
    else:
        items = await db.inventory.find({
            'user_id': user['_id'],
            'status': 'fresh',
            'quantity': {'$gt': 0}
        }, {'_id': 0, 'name': 1}).to_list(100)
        ingredients = [item['name'] for item in items]
    
    if not ingredients:
        raise HTTPException(status_code=400, detail='No ingredients available')
    
    if not gemini_client:
        raise HTTPException(status_code=500, detail='AI service not configured')
    
    try:
        # Create prompt for recipe generation
        prompt = f"""You are a professional chef assistant. Create a creative and practical recipe using these ingredients: {', '.join(ingredients)}

Provide the response in this exact format:
RECIPE NAME: [name]
INGREDIENTS:
- [ingredient 1]
- [ingredient 2]
...
INSTRUCTIONS:
[step by step instructions]
COOKING TIME: [time]"""
        
        # Generate recipe using new Gemini API
        response = gemini_client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt
        )
        recipe_text = response.text.strip()
        
        # Parse the response
        lines = recipe_text.split('\n')
        
        recipe_name = 'Suggested Recipe'
        recipe_ingredients = []
        instructions = ''
        cooking_time = 'Not specified'
        
        current_section = None
        for line in lines:
            line = line.strip()
            if line.startswith('RECIPE NAME:'):
                recipe_name = line.replace('RECIPE NAME:', '').strip()
            elif line.startswith('INGREDIENTS:'):
                current_section = 'ingredients'
            elif line.startswith('INSTRUCTIONS:'):
                current_section = 'instructions'
            elif line.startswith('COOKING TIME:'):
                cooking_time = line.replace('COOKING TIME:', '').strip()
                current_section = None
            elif current_section == 'ingredients' and line.startswith('-'):
                recipe_ingredients.append(line[1:].strip())
            elif current_section == 'instructions' and line:
                instructions += line + '\n'
        
        return RecipeResponse(
            recipe_name=recipe_name,
            ingredients=recipe_ingredients if recipe_ingredients else ingredients,
            instructions=instructions.strip() if instructions else recipe_text,
            cooking_time=cooking_time
        )
    except Exception as e:
        logger.error(f"Recipe generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recipe: {str(e)}")

@api_router.get('/shopping-suggestions', response_model=List[ShoppingSuggestionResponse])
async def get_shopping_suggestions(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    
    # Fetch all pending suggestions once (optimization to avoid N+1 queries)
    existing_suggestions = await db.shopping_suggestions.find({
        'user_id': user['_id'],
        'status': 'pending'
    }, {'_id': 0}).to_list(1000)
    pending_suggestions_map = {s['name']: s for s in existing_suggestions}
    
    inventory_items = await db.inventory.find({'user_id': user['_id']}).to_list(1000)
    
    for item in inventory_items:
        expiry = datetime.fromisoformat(item['expiration_date'].replace('Z', '+00:00'))
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        days_diff = (expiry - now).days
        
        should_suggest = False
        reason = ''
        
        if item['quantity'] <= 0:
            should_suggest = True
            reason = 'Out of stock'
        elif days_diff < 0:
            should_suggest = True
            reason = 'Expired'
        
        if should_suggest and item['name'] not in pending_suggestions_map:
            suggestion_id = str(uuid.uuid4())
            suggestion_doc = {
                'id': suggestion_id,
                'name': item['name'],
                'category': item['category'],
                'quantity': item['quantity'] if item['quantity'] > 0 else 1,
                'unit': item['unit'],
                'reason': reason,
                'source_item_id': item.get('id'),
                'status': 'pending',
                'user_id': user['_id'],
                'created_at': now.isoformat()
            }
            await db.shopping_suggestions.insert_one(suggestion_doc)
            pending_suggestions_map[item['name']] = suggestion_doc
    
    return [ShoppingSuggestionResponse(**s) for s in pending_suggestions_map.values()]

@api_router.post('/shopping-suggestions/{suggestion_id}/approve')
async def approve_shopping_suggestion(suggestion_id: str, user: dict = Depends(get_current_user)):
    suggestion = await db.shopping_suggestions.find_one({
        'id': suggestion_id,
        'user_id': user['_id'],
        'status': 'pending'
    })
    
    if not suggestion:
        raise HTTPException(status_code=404, detail='Suggestion not found')
    
    now = datetime.now(timezone.utc)
    shopping_item = {
        'id': str(uuid.uuid4()),
        'name': suggestion['name'],
        'category': suggestion['category'],
        'quantity': suggestion['quantity'],
        'unit': suggestion['unit'],
        'purchased': False,
        'user_id': user['_id'],
        'created_at': now.isoformat()
    }
    await db.shopping_list.insert_one(shopping_item)
    
    await db.shopping_suggestions.update_one(
        {'id': suggestion_id},
        {'$set': {'status': 'approved'}}
    )
    
    return {'message': 'Suggestion approved and added to shopping list'}

@api_router.delete('/shopping-suggestions/{suggestion_id}')
async def reject_shopping_suggestion(suggestion_id: str, user: dict = Depends(get_current_user)):
    result = await db.shopping_suggestions.update_one(
        {'id': suggestion_id, 'user_id': user['_id'], 'status': 'pending'},
        {'$set': {'status': 'rejected'}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Suggestion not found')
    return {'message': 'Suggestion rejected'}

@api_router.post('/my-recipes', response_model=MyRecipeResponse)
async def create_my_recipe(data: MyRecipeRequest, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    recipe_id = str(uuid.uuid4())
    recipe_doc = {
        'id': recipe_id,
        'title': data.title,
        'description': data.description,
        'ingredients': data.ingredients or [],
        'instructions': data.instructions,
        'files': [],
        'user_id': user['_id'],
        'created_at': now.isoformat(),
        'updated_at': now.isoformat()
    }
    await db.my_recipes.insert_one(recipe_doc)
    return MyRecipeResponse(**recipe_doc)

@api_router.get('/my-recipes', response_model=List[MyRecipeResponse])
async def get_my_recipes(user: dict = Depends(get_current_user)):
    recipes = await db.my_recipes.find({'user_id': user['_id']}, {'_id': 0}).to_list(1000)
    return [MyRecipeResponse(**r) for r in recipes]

@api_router.get('/my-recipes/{recipe_id}', response_model=MyRecipeResponse)
async def get_my_recipe(recipe_id: str, user: dict = Depends(get_current_user)):
    recipe = await db.my_recipes.find_one({'id': recipe_id, 'user_id': user['_id']}, {'_id': 0})
    if not recipe:
        raise HTTPException(status_code=404, detail='Recipe not found')
    return MyRecipeResponse(**recipe)

@api_router.put('/my-recipes/{recipe_id}', response_model=MyRecipeResponse)
async def update_my_recipe(recipe_id: str, data: MyRecipeRequest, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    update_doc = {
        'title': data.title,
        'description': data.description,
        'ingredients': data.ingredients or [],
        'instructions': data.instructions,
        'updated_at': now.isoformat()
    }
    result = await db.my_recipes.update_one(
        {'id': recipe_id, 'user_id': user['_id']},
        {'$set': update_doc}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Recipe not found')
    
    recipe = await db.my_recipes.find_one({'id': recipe_id}, {'_id': 0})
    return MyRecipeResponse(**recipe)

@api_router.delete('/my-recipes/{recipe_id}')
async def delete_my_recipe(recipe_id: str, user: dict = Depends(get_current_user)):
    recipe = await db.my_recipes.find_one({'id': recipe_id, 'user_id': user['_id']})
    if not recipe:
        raise HTTPException(status_code=404, detail='Recipe not found')
    
    # Bulk update all recipe files in a single query (optimization)
    file_ids = [file['id'] for file in recipe.get('files', [])]
    if file_ids:
        await db.recipe_files.update_many(
            {'id': {'$in': file_ids}},
            {'$set': {'is_deleted': True}}
        )
    
    result = await db.my_recipes.delete_one({'id': recipe_id, 'user_id': user['_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Recipe not found')
    return {'message': 'Recipe deleted successfully'}

@api_router.post('/my-recipes/{recipe_id}/upload')
async def upload_recipe_file(
    recipe_id: str,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    recipe = await db.my_recipes.find_one({'id': recipe_id, 'user_id': user['_id']})
    if not recipe:
        raise HTTPException(status_code=404, detail='Recipe not found')
    
    # Read file content
    file_content = await file.read()
    content_type = file.content_type or 'application/octet-stream'
    
    # Upload to Cloudinary
    folder = f"recipes/{user['_id']}"
    cloudinary_result = upload_to_cloudinary(file_content, file.filename, folder)
    
    file_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    file_doc = {
        'id': file_id,
        'recipe_id': recipe_id,
        'cloudinary_url': cloudinary_result['secure_url'],
        'cloudinary_public_id': cloudinary_result['public_id'],
        'resource_type': cloudinary_result['resource_type'],
        'original_filename': file.filename,
        'content_type': content_type,
        'size': cloudinary_result['bytes'],
        'is_deleted': False,
        'user_id': user['_id'],
        'created_at': now.isoformat()
    }
    await db.recipe_files.insert_one(file_doc)
    
    file_ref = {
        'id': file_id,
        'filename': file.filename,
        'size': cloudinary_result['bytes'],
        'content_type': content_type,
        'url': cloudinary_result['secure_url']
    }
    
    await db.my_recipes.update_one(
        {'id': recipe_id},
        {'$push': {'files': file_ref}}
    )
    
    return file_ref

@api_router.get('/my-recipes/{recipe_id}/files/{file_id}/download')
async def download_recipe_file(recipe_id: str, file_id: str, user: dict = Depends(get_current_user)):
    file_record = await db.recipe_files.find_one({
        'id': file_id,
        'recipe_id': recipe_id,
        'user_id': user['_id'],
        'is_deleted': False
    })
    
    if not file_record:
        raise HTTPException(status_code=404, detail='File not found')
    
    # Redirect to Cloudinary URL for direct download
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=file_record['cloudinary_url'])

@api_router.delete('/my-recipes/{recipe_id}/files/{file_id}')
async def delete_recipe_file(recipe_id: str, file_id: str, user: dict = Depends(get_current_user)):
    file_record = await db.recipe_files.find_one({
        'id': file_id,
        'recipe_id': recipe_id,
        'user_id': user['_id']
    })
    
    if not file_record:
        raise HTTPException(status_code=404, detail='File not found')
    
    # Delete from Cloudinary
    if 'cloudinary_public_id' in file_record:
        delete_from_cloudinary(
            file_record['cloudinary_public_id'],
            file_record.get('resource_type', 'raw')
        )
    
    # Mark as deleted in database
    await db.recipe_files.update_one(
        {'id': file_id},
        {'$set': {'is_deleted': True}}
    )
    
    await db.my_recipes.update_one(
        {'id': recipe_id},
        {'$pull': {'files': {'id': file_id}}}
    )
    
    return {'message': 'File deleted successfully'}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.on_event('startup')
async def startup_event():
    await db.users.create_index('email', unique=True)
    
    # Initialize Cloudinary
    try:
        init_cloudinary()
        logger.info("Cloudinary initialized successfully")
    except Exception as e:
        logger.error(f"Cloudinary initialization failed: {e}")
    
    # Initialize Gemini AI
    try:
        init_gemini()
        logger.info("Gemini AI initialized successfully")
    except Exception as e:
        logger.error(f"Gemini AI initialization failed: {e}")
    
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@kitchenapp.com')
    admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
    existing = await db.users.find_one({'email': admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            'email': admin_email,
            'password_hash': hashed,
            'name': 'Admin',
            'role': 'admin',
            'created_at': datetime.now(timezone.utc)
        })
        logger.info(f'Admin user created: {admin_email}')
    elif not verify_password(admin_password, existing['password_hash']):
        await db.users.update_one(
            {'email': admin_email},
            {'$set': {'password_hash': hash_password(admin_password)}}
        )
    
    Path('/app/memory').mkdir(exist_ok=True)
    with open('/app/memory/test_credentials.md', 'w') as f:
        f.write(f"""# Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/inventory
- POST /api/inventory
- PUT /api/inventory/{{item_id}}
- DELETE /api/inventory/{{item_id}}
- GET /api/shopping-list
- POST /api/shopping-list
- PUT /api/shopping-list/{{item_id}}/toggle
- DELETE /api/shopping-list/{{item_id}}
- GET /api/analytics
- POST /api/recipes/generate
""")

@app.on_event('shutdown')
async def shutdown_db_client():
    client.close()