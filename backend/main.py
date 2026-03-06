from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.models import load_model
import numpy as np
import cv2
import pickle
import io

app = FastAPI()

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and label encoder once at startup
model = load_model("model.keras")

with open("label_encoder.pkl", "rb") as f:
    label_encoder = pickle.load(f)


@app.get("/")
def read_root():
    return {"message": "Roman Numeral CNN API is running"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Read uploaded image bytes
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)

    # Decode image as grayscale
    img = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)

    if img is None:
        return {"error": "Could not read image. Please upload a valid image file."}

    # Preprocess (same as training)
    img = cv2.resize(img, (50, 50))
    img = img.astype("float32") / 255.0
    img = np.expand_dims(img, axis=-1)   # shape: (50, 50, 1)
    img = np.expand_dims(img, axis=0)    # shape: (1, 50, 50, 1)

    # Predict
    predictions = model.predict(img)
    class_index = int(np.argmax(predictions))
    confidence = float(np.max(predictions)) * 100

    # Decode label
    label = label_encoder.inverse_transform([class_index])[0]

    # Return top 3 predictions
    top3_indices = np.argsort(predictions[0])[::-1][:3]
    top3 = [
        {
            "label": label_encoder.inverse_transform([int(i)])[0],
            "confidence": round(float(predictions[0][i]) * 100, 2)
        }
        for i in top3_indices
    ]

    return {
        "prediction": label,
        "confidence": round(confidence, 2),
        "top3": top3
    }