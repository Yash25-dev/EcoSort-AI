import os
import io
import numpy as np
import tensorflow as tf

from PIL import Image

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


# ==========================================================
# FASTAPI APP
# ==========================================================

app = FastAPI(
    title="EcoSort AI Backend",
    description="AI Powered Waste Classification",
    version="1.0"
)


# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# CLASS NAMES
# ==========================================================

CLASS_NAMES = [
    "cardboard",
    "glass",
    "metal",
    "paper",
    "plastic",
    "trash"
]


# ==========================================================
# MODEL PATH
# ==========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "..",
    "model",
    "ecosort_model.keras"
)


# ==========================================================
# LOAD MODEL
# ==========================================================

print("\nLoading EcoSort AI model...")

model = tf.keras.models.load_model(
    MODEL_PATH,
    compile=False
)

print("Model Loaded Successfully!")

print("Input Shape :", model.input_shape)
print("Output Shape:", model.output_shape)

# ==========================================================
# IMAGE PREPROCESSING
# ==========================================================

def preprocess_image(image_bytes):

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    image = image.resize((224, 224))

    image_array = np.array(image).astype(np.float32)

    image_array = np.expand_dims(image_array, axis=0)

    return image_array

# ==========================================================
# HOME ROUTE
# ==========================================================

@app.get("/")
def home():

    return {
        "message": "EcoSort AI Backend is Running!"
    }


# ==========================================================
# HEALTH CHECK
# ==========================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "model_loaded": True
    }


# ==========================================================
# PREDICT
# ==========================================================

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    try:

        image_bytes = await file.read()

        image = preprocess_image(image_bytes)

        predictions = model.predict(image, verbose=0)[0]

        predicted_index = int(np.argmax(predictions))

        predicted_class = CLASS_NAMES[predicted_index]

        confidence = float(predictions[predicted_index] * 100)

        all_predictions = {}

        for i, class_name in enumerate(CLASS_NAMES):

            all_predictions[class_name] = round(
                float(predictions[i] * 100),
                2
            )

        return JSONResponse({

            "success": True,

            "category": predicted_class,

            "confidence": round(confidence, 2),

            "predicted_index": predicted_index,

            "all_predictions": all_predictions

        })

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    
    # ==========================================================
# RUN SERVER
# ==========================================================

import os
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        reload=False
    )