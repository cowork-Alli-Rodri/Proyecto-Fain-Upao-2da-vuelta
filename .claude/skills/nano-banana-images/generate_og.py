"""
generate_og.py — OG image pipeline with local reference image

Usage:
  py generate_og.py <local_image_path> <prompt_json_file> <output_file> [aspect_ratio]

Steps:
  1. Uploads local image to catbox.moe → gets public URL
  2. Injects URL as image_input into the Kie.ai prompt
  3. Polls until done and downloads the result
"""

import os
import sys
import json
import time
import requests


def upload_to_catbox(image_path: str) -> str:
    print(f"Uploading reference image: {image_path}")
    with open(image_path, "rb") as f:
        resp = requests.post(
            "https://catbox.moe/user/api.php",
            data={"reqtype": "fileupload"},
            files={"fileToUpload": (os.path.basename(image_path), f, "image/png")},
            timeout=60,
        )
    resp.raise_for_status()
    url = resp.text.strip()
    if not url.startswith("http"):
        raise RuntimeError(f"Unexpected catbox response: {url}")
    print(f"Reference image uploaded: {url}")
    return url


def load_api_key(script_dir: str) -> str:
    env_path = os.path.join(script_dir, "..", ".env")
    if not os.path.exists(env_path):
        raise FileNotFoundError(f".env not found at {env_path}")
    with open(env_path, "r") as f:
        for line in f:
            if line.startswith("KIE_API_KEY="):
                return line.strip().split("=", 1)[1].strip("\"'")
    raise ValueError("KIE_API_KEY not found in .env")


def create_task(api_key: str, prompt_json: dict, ref_url: str, aspect_ratio: str) -> str:
    api_params = prompt_json.pop("api_parameters", {})
    prompt_json.pop("image_input", None)  # remove any existing, we inject the real one

    payload = {
        "model": "nano-banana-2",
        "input": {
            "prompt": json.dumps(prompt_json),
            "aspect_ratio": api_params.get("aspect_ratio", aspect_ratio),
            "resolution": api_params.get("resolution", "2K"),
            "output_format": api_params.get("output_format", "jpg"),
            "image_input": [ref_url],
        },
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    print("Creating Kie.ai task...")
    resp = requests.post(
        "https://api.kie.ai/api/v1/jobs/createTask",
        headers=headers,
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    task_id = data.get("data", {}).get("taskId")
    if not task_id:
        raise RuntimeError(f"No taskId in response: {data}")
    print(f"Task ID: {task_id}. Polling...")
    return task_id


def poll_and_download(api_key: str, task_id: str, output_file: str):
    headers = {"Authorization": f"Bearer {api_key}"}
    poll_url = "https://api.kie.ai/api/v1/jobs/recordInfo"

    for attempt in range(1, 61):
        time.sleep(4)
        resp = requests.get(poll_url, headers=headers, params={"taskId": task_id}, timeout=15)
        resp.raise_for_status()
        data = resp.json().get("data", {})
        state = data.get("state", "unknown")
        print(f"Poll {attempt}: state = {state}")

        if state in ("success", "completed"):
            result_json = json.loads(data.get("resultJson", "{}"))
            urls = result_json.get("resultUrls", [])
            if not urls:
                raise RuntimeError("No resultUrls in response")
            image_url = urls[0]
            print(f"Downloading from {image_url}")
            img_resp = requests.get(image_url, timeout=30)
            img_resp.raise_for_status()
            os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
            with open(output_file, "wb") as f:
                f.write(img_resp.content)
            print(f"Saved to {output_file}")
            return

        if state in ("failed", "error"):
            raise RuntimeError(f"Task failed: {json.dumps(data, indent=2)}")

    raise TimeoutError("Timed out waiting for Kie.ai job")


def run():
    if len(sys.argv) < 4:
        print("Usage: py generate_og.py <local_image> <prompt_json> <output_file> [aspect_ratio]")
        sys.exit(1)

    local_image = sys.argv[1]
    prompt_file = sys.argv[2]
    output_file = sys.argv[3]
    aspect_ratio = sys.argv[4] if len(sys.argv) > 4 else "16:9"

    script_dir = os.path.dirname(os.path.abspath(__file__))

    try:
        ref_url = upload_to_catbox(local_image)
        api_key = load_api_key(script_dir)

        with open(prompt_file, "r", encoding="utf-8") as f:
            prompt_json = json.load(f)

        task_id = create_task(api_key, prompt_json, ref_url, aspect_ratio)
        poll_and_download(api_key, task_id, output_file)

    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    run()
