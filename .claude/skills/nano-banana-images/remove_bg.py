import sys
from rembg import remove
from PIL import Image
import io

def remove_bg(input_path, output_path):
    with open(input_path, 'rb') as f:
        data = f.read()
    result = remove(data)
    img = Image.open(io.BytesIO(result)).convert("RGBA")
    img.save(output_path, "PNG")
    print(f"Saved: {output_path}")

if __name__ == "__main__":
    for i in range(1, len(sys.argv) - 1, 2):
        remove_bg(sys.argv[i], sys.argv[i+1])
