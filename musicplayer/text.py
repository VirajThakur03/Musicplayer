import syncedlyrics
import re
import json
import sys

# ===============================
# LANGUAGE DETECTION (Basic)
# ===============================
def detect_language(text):
    # Check for Devanagari characters (Hindi/Marathi)
    devanagari_pattern = r'[\u0900-\u097F]'
    if re.search(devanagari_pattern, text):
        return "Hindi/Marathi (Devanagari Script)"
    return "Unknown / Possibly English"

# ===============================
# INPUT
# ===============================
query = input("Enter Song Name: ").strip()

if not query:
    print("❌ No song name provided.")
    sys.exit()

# ===============================
# FETCH LYRICS
# ===============================
try:
    lrc = syncedlyrics.search(query)
except Exception as e:
    print("❌ Error fetching lyrics:", e)
    sys.exit()

if not lrc:
    print("❌ No synced lyrics found for this song.")
    sys.exit()

print("\n✅ Lyrics fetched successfully.\n")

# ===============================
# PROCESS LYRICS
# ===============================
lines = lrc.split("\n")
json_data = []

pattern = r"\[(\d+):(\d+)(?:\.(\d+))?\]\s*(.+)"

for line in lines:
    match = re.match(pattern, line)

    if match:
        minutes = int(match.group(1))
        seconds = int(match.group(2))
        milliseconds = match.group(3)
        text = match.group(4).strip()

        total_seconds = minutes * 60 + seconds

        if milliseconds:
            total_seconds += float("0." + milliseconds)

        json_entry = {
            "time_seconds": round(total_seconds, 2),
            "timestamp": f"{minutes:02}:{seconds:02}",
            "lyrics": text,
            "language": detect_language(text)
        }

        json_data.append(json_entry)

# ===============================
# OUTPUT
# ===============================
if not json_data:
    print("⚠️ Lyrics found but no timestamped lines matched.")
else:
    print("🎵 Parsed Synced Lyrics:\n")
    print(json.dumps(json_data, indent=4, ensure_ascii=False))

    # Optional: Save to file
    save_choice = input("\nDo you want to save as JSON file? (y/n): ").lower()
    if save_choice == "y":
        filename = query.replace(" ", "_") + "_lyrics.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(json_data, f, indent=4, ensure_ascii=False)
        print(f"✅ Saved as {filename}")