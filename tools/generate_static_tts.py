#!/usr/bin/env python3
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import soundfile as sf
from huggingface_hub import snapshot_download

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "recipes-fallback.json"
OUT = ROOT / "assets" / "audio"
MODEL_CACHE = ROOT / ".cache" / "ppaso-tts-v1"
ORDINALS = ["첫번째","두번째","세번째","네번째","다섯번째","여섯번째","일곱번째","여덟번째","아홉번째","열번째","열한번째","열두번째"]

def normalize(text: str) -> str:
    text = str(text or "")
    replacements = [
        (r"1/2\s*대", "반 대"),
        (r"1/2\s*개", "반 개"),
        (r"1/2\s*모", "반 모"),
        (r"1/3", "3분의 1"),
        (r"1/4", "4분의 1"),
        (r"2/3", "3분의 2"),
        (r"(\d+(?:\.\d+)?)\s*cm", r"\1 센티미터"),
        (r"(\d+(?:\.\d+)?)\s*ml", r"\1 밀리리터"),
        (r"(\d+(?:\.\d+)?)\s*g", r"\1 그램"),
    ]
    for pattern, repl in replacements:
        text = re.sub(pattern, repl, text, flags=re.I)
    return re.sub(r"\s+", " ", text).strip()

def ordinal(index):
    return ORDINALS[index] if index < len(ORDINALS) else f"{index + 1}번째"

def step_text(step, index):
    parts = [f"{ordinal(index)} 단계입니다.", step["text"]]
    if step.get("tip"):
        parts.append(f"팁입니다. {step['tip']}")
    return normalize(" ".join(parts))

def recipe_text(recipe):
    ingredients = ", ".join(f"{i['name']} {i['amount']}" for i in recipe["ingredients"])
    steps = " ".join(step_text(step, i) for i, step in enumerate(recipe["steps"]))
    return normalize(f"{recipe['name']} 레시피입니다. {recipe.get('description','')} 필요한 재료는 {ingredients}입니다. {steps}")

def ensure_model():
    path = snapshot_download(
        repo_id="akamotaco/ppaso-tts-v1",
        local_dir=str(MODEL_CACHE),
        ignore_patterns=["rknn/**", "samples/**", "**/*.mp4", "**/*.png", "**/*.vrm"],
    )
    candidates = list(Path(path).rglob("ppaso_tts.py"))
    if not candidates:
        raise RuntimeError("ppaso_tts.py not found in downloaded model repository")
    sys.path.insert(0, str(candidates[0].parent))
    from ppaso_tts import PpasoTTS
    return PpasoTTS(path, backend="onnx")

def synth_to_mp3(tts, text, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    wav_path = target.with_suffix(".wav")
    wav = tts.synthesize(text)
    sf.write(wav_path, wav, 22050)
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(wav_path),
        "-af", "asetrate=22050*0.88,aresample=22050,atempo=1.13636",
        "-codec:a", "libmp3lame", "-b:a", "64k",
        str(target)
    ], check=True)
    wav_path.unlink(missing_ok=True)

def main():
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    recipes = payload.get("recipes", [])
    OUT.mkdir(parents=True, exist_ok=True)
    tts = ensure_model()

    manifest = {"version": 2, "voice": "low", "recipes": {}}
    for recipe in recipes:
        rid = recipe["id"]
        rdir = OUT / rid
        manifest["recipes"][rid] = {"steps": []}

        for idx, step in enumerate(recipe["steps"]):
            target = rdir / f"step-{idx + 1}.mp3"
            synth_to_mp3(tts, step_text(step, idx), target)
            manifest["recipes"][rid]["steps"].append(str(target.relative_to(ROOT)).replace(os.sep, "/"))

        full_target = rdir / "full.mp3"
        synth_to_mp3(tts, recipe_text(recipe), full_target)
        manifest["recipes"][rid]["full"] = str(full_target.relative_to(ROOT)).replace(os.sep, "/")

    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )
    print(f"Generated low-pitch static TTS for {len(recipes)} recipes.")

if __name__ == "__main__":
    main()
