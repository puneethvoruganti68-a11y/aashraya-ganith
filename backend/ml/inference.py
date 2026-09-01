import json
import pickle
import sys
from pathlib import Path

import numpy as np
import pandas as pd


# =========================================================
# AASHRAYA GANITH
# XGBOOST ML INFERENCE ENGINE
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = PROJECT_ROOT / "datasets" / "models"

TEMP_MODEL_PATH = MODEL_DIR / "thermal_temperature_xgboost_best.pkl"
HUMIDITY_MODEL_PATH = MODEL_DIR / "thermal_humidity_xgboost_best.pkl"


TEMP_LAGS = [1, 2, 3, 6, 12, 24, 48, 144]
HUMIDITY_LAGS = [1, 2, 3, 6, 12, 24, 48, 144]

LOCATIONS = ["Delhi", "Dhaka", "Faisalabad", "Yavatmal"]


# ---------------------------------------------------------
# LOAD TRAINED MODELS
# ---------------------------------------------------------

def load_bundle(path):
    if not path.exists():
        raise FileNotFoundError(f"Model not found: {path}")

    with open(path, "rb") as f:
        bundle = pickle.load(f)

    if not isinstance(bundle, dict):
        raise ValueError(f"Invalid model bundle: {path}")

    return bundle


TEMP_BUNDLE = load_bundle(TEMP_MODEL_PATH)
HUMIDITY_BUNDLE = load_bundle(HUMIDITY_MODEL_PATH)

TEMP_MODEL = TEMP_BUNDLE["model"]
HUMIDITY_MODEL = HUMIDITY_BUNDLE["model"]

TEMP_FEATURES = TEMP_BUNDLE["features"]
HUMIDITY_FEATURES = HUMIDITY_BUNDLE["features"]


# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------

def number(value, default=0.0):
    try:
        value = float(value)
        if np.isfinite(value):
            return value
    except (TypeError, ValueError):
        pass
    return float(default)


def build_time_features(timestamp):
    ts = pd.Timestamp(timestamp)

    hour = int(ts.hour)
    minute = int(ts.minute)
    day = int(ts.day)
    month = int(ts.month)
    day_of_year = int(ts.dayofyear)
    year = int(ts.year)

    return {
        "hour": hour,
        "minute": minute,
        "day": day,
        "month": month,
        "day_of_year": day_of_year,
        "hour_sin": np.sin(2 * np.pi * hour / 24),
        "hour_cos": np.cos(2 * np.pi * hour / 24),
        "month_sin": np.sin(2 * np.pi * month / 12),
        "month_cos": np.cos(2 * np.pi * month / 12),
        "year": year,
    }


def location_features(location):
    """
    Reproduce pd.get_dummies(..., columns=["location"], dtype=float)
    used during training.

    The trained models contain exactly these four columns.
    Unknown locations intentionally become all-zero vectors.
    """

    location = str(location or "").strip()

    return {
        "location_Delhi": 1.0 if location == "Delhi" else 0.0,
        "location_Dhaka": 1.0 if location == "Dhaka" else 0.0,
        "location_Faisalabad": 1.0 if location == "Faisalabad" else 0.0,
        "location_Yavatmal": 1.0 if location == "Yavatmal" else 0.0,
    }


def historical_features(target, current_value, history):
    """
    Build the lag and rolling features expected by the trained model.

    If real shelter history is supplied, it is used.

    For a new shelter with no historical indoor sensor readings,
    the current supplied value is used as an initialization baseline.
    This is explicitly marked in the response rather than being
    presented as measured historical data.
    """

    values = []

    if isinstance(history, list):
        for value in history:
            try:
                value = float(value)
                if np.isfinite(value):
                    values.append(value)
            except (TypeError, ValueError):
                pass

    baseline = number(current_value, 0.0)

    # Most recent history first.
    values = values[-144:]

    if not values:
        values = [baseline] * 144
        history_mode = "initialized_from_current_input"
    else:
        while len(values) < 144:
            values.insert(0, values[0])
        history_mode = "provided_sensor_history"

    result = {}

    for lag in TEMP_LAGS if target == "temperature" else HUMIDITY_LAGS:
        result[
            f"indoor_{'temp' if target == 'temperature' else 'humidity'}_lag_{lag}"
        ] = values[-lag]

    prefix = "indoor_temp" if target == "temperature" else "indoor_humidity"

    last_6 = values[-6:]
    last_24 = values[-24:]

    result[f"{prefix}_roll_mean_6"] = float(np.mean(last_6))
    result[f"{prefix}_roll_mean_24"] = float(np.mean(last_24))

    if len(last_24) >= 2:
        result[f"{prefix}_roll_std_24"] = float(np.std(last_24, ddof=1))
    else:
        result[f"{prefix}_roll_std_24"] = 0.0

    return result, history_mode


# ---------------------------------------------------------
# BUILD MODEL ROW
# ---------------------------------------------------------

def build_temperature_row(data):
    timestamp = data.get("timestamp") or pd.Timestamp.now().isoformat()

    row = {
        "outdoor_temperature": number(data.get("outdoor_temperature")),
        "outdoor_humidity": number(data.get("outdoor_humidity")),
        "outdoor_wind_speed": number(data.get("outdoor_wind_speed")),
        "outdoor_solar_radiation": number(data.get("outdoor_solar_radiation")),
        "nasa_temperature": number(
            data.get("nasa_temperature"),
            number(data.get("outdoor_temperature"))
        ),
        "nasa_humidity": number(
            data.get("nasa_humidity"),
            number(data.get("outdoor_humidity"))
        ),
        "nasa_wind_speed": number(
            data.get("nasa_wind_speed"),
            number(data.get("outdoor_wind_speed"))
        ),
        "nasa_solar_radiation": number(
            data.get("nasa_solar_radiation"),
            number(data.get("outdoor_solar_radiation"))
        ),
        "indoor_humidity": number(
            data.get("indoor_humidity"),
            number(data.get("outdoor_humidity"))
        ),
    }

    row.update(build_time_features(timestamp))

    history_features, history_mode = historical_features(
        "temperature",
        data.get("indoor_temperature"),
        data.get("indoor_temperature_history")
    )

    row.update(history_features)
    row.update(location_features(data.get("location")))

    return row, history_mode


def build_humidity_row(data):
    timestamp = data.get("timestamp") or pd.Timestamp.now().isoformat()

    row = {
        "outdoor_temperature": number(data.get("outdoor_temperature")),
        "outdoor_humidity": number(data.get("outdoor_humidity")),
        "outdoor_wind_speed": number(data.get("outdoor_wind_speed")),
        "outdoor_solar_radiation": number(data.get("outdoor_solar_radiation")),
        "nasa_temperature": number(
            data.get("nasa_temperature"),
            number(data.get("outdoor_temperature"))
        ),
        "nasa_humidity": number(
            data.get("nasa_humidity"),
            number(data.get("outdoor_humidity"))
        ),
        "nasa_wind_speed": number(
            data.get("nasa_wind_speed"),
            number(data.get("outdoor_wind_speed"))
        ),
        "nasa_solar_radiation": number(
            data.get("nasa_solar_radiation"),
            number(data.get("outdoor_solar_radiation"))
        ),
    }

    row.update(build_time_features(timestamp))

    history_features, history_mode = historical_features(
        "humidity",
        data.get("indoor_humidity"),
        data.get("indoor_humidity_history")
    )

    row.update(history_features)
    row.update(location_features(data.get("location")))

    return row, history_mode


# ---------------------------------------------------------
# ALIGN FEATURES EXACTLY TO SAVED MODEL
# ---------------------------------------------------------

def align_features(row, expected_features):
    frame = pd.DataFrame([row])

    for feature in expected_features:
        if feature not in frame.columns:
            frame[feature] = 0.0

    frame = frame[expected_features]

    frame = frame.replace([np.inf, -np.inf], np.nan)

    return frame.fillna(0.0)


# ---------------------------------------------------------
# PREDICT
# ---------------------------------------------------------

def predict(data):
    temp_row, temp_history_mode = build_temperature_row(data)
    humidity_row, humidity_history_mode = build_humidity_row(data)

    X_temp = align_features(temp_row, TEMP_FEATURES)
    X_humidity = align_features(humidity_row, HUMIDITY_FEATURES)

    temperature_prediction = float(TEMP_MODEL.predict(X_temp)[0])
    humidity_prediction = float(HUMIDITY_MODEL.predict(X_humidity)[0])

    humidity_prediction = max(0.0, min(100.0, humidity_prediction))

    location = str(data.get("location") or "Unknown")

    known_location = location in LOCATIONS

    return {
        "success": True,

        "prediction": {
            "indoor_temperature": round(temperature_prediction, 3),
            "indoor_humidity": round(humidity_prediction, 3),
        },

        "model": {
            "temperature": {
                "type": "XGBoost",
                "target": TEMP_BUNDLE.get("target"),
                "features": len(TEMP_FEATURES),
                "best_iteration": int(
                    getattr(TEMP_MODEL, "best_iteration", -1)
                ),
            },
            "humidity": {
                "type": "XGBoost",
                "target": HUMIDITY_BUNDLE.get("target"),
                "features": len(HUMIDITY_FEATURES),
                "best_iteration": int(
                    getattr(HUMIDITY_MODEL, "best_iteration", -1)
                ),
            },
        },

        "input_context": {
            "location": location,
            "known_training_location": known_location,
            "supported_training_locations": LOCATIONS,
            "temperature_history": temp_history_mode,
            "humidity_history": humidity_history_mode,
        },
    }


# ---------------------------------------------------------
# CLI
# ---------------------------------------------------------

def main():
    try:
        raw = sys.stdin.read()

        if not raw.strip():
            raise ValueError("No JSON input supplied.")

        data = json.loads(raw)
        result = predict(data)

        print(json.dumps(result))

    except Exception as exc:
        print(
            json.dumps({
                "success": False,
                "error": str(exc),
            })
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
