import sys
import struct

def check_mp4_audio(file_path):
    print(f"Checking {file_path} for audio tracks...")
    try:
        with open(file_path, 'rb') as f:
            data = f.read()
            # Look for 'soun' (sound track) atom in the MP4 file
            if b'soun' in data:
                print("Found 'soun' handler reference in MP4! This indicates an audio track is present.")
                # Find occurrences
                idx = 0
                while True:
                    idx = data.find(b'soun', idx)
                    if idx == -1:
                        break
                    print(f"  - 'soun' found at byte {idx}")
                    idx += 4
            else:
                print("NO 'soun' handler reference found! The video does NOT have an audio track.")
            
            # Also look for 'mp4a' (MPEG-4 Audio) or 'aac '
            if b'mp4a' in data:
                print("Found 'mp4a' audio box! (AAC audio)")
            if b'ac-3' in data:
                print("Found 'ac-3' audio box!")
    except Exception as e:
        print(f"Error reading file: {e}")

if __name__ == "__main__":
    check_mp4_audio("assets/videos/portfolio.mp4")
