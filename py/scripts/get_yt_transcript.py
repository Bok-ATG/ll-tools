#!/usr/bin/env python3

"""
Download a YouTube video's transcript as SRT, clean Markdown, and JSON.
Uses youtube-transcript-api for reliable transcript retrieval.
"""

import sys
import os
import json
from pathlib import Path
from urllib.parse import urlparse, parse_qs

def extract_video_id(url_or_id):
    """Extract video ID from YouTube URL or return ID if already an ID."""
    if len(url_or_id) == 11 and url_or_id.isalnum():
        return url_or_id
    
    parsed = urlparse(url_or_id)
    if parsed.hostname in ['www.youtube.com', 'youtube.com', 'm.youtube.com']:
        if parsed.path == '/watch':
            return parse_qs(parsed.query).get('v', [None])[0]
        elif parsed.path.startswith('/embed/'):
            return parsed.path.split('/')[2]
    elif parsed.hostname in ['youtu.be']:
        return parsed.path[1:]
    
    return None

def format_time_srt(seconds):
    """Convert seconds to SRT time format (HH:MM:SS,mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

def create_srt(transcript_data):
    """Convert transcript data to SRT format."""
    srt_lines = []
    for i, entry in enumerate(transcript_data, 1):
        start_time = format_time_srt(entry['start'])
        end_time = format_time_srt(entry['start'] + entry['duration'])
        text = entry['text'].strip()
        
        srt_lines.append(str(i))
        srt_lines.append(f"{start_time} --> {end_time}")
        srt_lines.append(text)
        srt_lines.append("")
    
    return "\n".join(srt_lines)

def create_markdown(transcript_data):
    """Convert transcript data to clean markdown format."""
    md_lines = []
    for entry in transcript_data:
        text = entry['text'].strip()
        if text:
            md_lines.append(text)
    
    return "\n".join(md_lines)

def create_json(transcript_data):
    """Convert transcript data to JSON format."""
    json_data = []
    for entry in transcript_data:
        start_time = format_time_srt(entry['start'])
        end_time = format_time_srt(entry['start'] + entry['duration'])
        json_data.append({
            "in_ts": start_time,
            "out_ts": end_time,
            "text": entry['text'].strip()
        })
    
    return json.dumps(json_data, indent=2, ensure_ascii=False)

def main():
    if len(sys.argv) < 2:
        print("Usage: get-yt-transcript <YouTube-URL-or-ID> [optional-local-video-file]", file=sys.stderr)
        sys.exit(1)
    
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        print("❌ youtube-transcript-api not installed. Run: pip install youtube-transcript-api", file=sys.stderr)
        sys.exit(1)
    
    src = sys.argv[1]
    vid = extract_video_id(src)
    
    if not vid:
        print(f"⚠︎ Couldn't extract video ID from '{src}'", file=sys.stderr)
        sys.exit(1)
    
    # Output directory and file naming
    outdir = Path.home() / "Desktop" / "youtube_transcripts"
    outdir.mkdir(exist_ok=True)
    
    basename = vid
    if len(sys.argv) > 2 and os.path.isfile(sys.argv[2]):
        basename = Path(sys.argv[2]).stem
    
    srt_file = outdir / f"{basename}.en.srt"
    md_file = outdir / f"{basename}.md"
    json_file = outdir / f"{basename}.json"
    
    print(f"📥 Downloading subtitles for: {src}")
    print(f"→ {srt_file}")
    print(f"→ {md_file}")
    print(f"→ {json_file}")
    
    try:
        # Try to get transcript (prefers manual over auto-generated)
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.list(vid)
        
        # Try to find English transcript (manual first, then auto-generated)
        try:
            transcript = transcript_list.find_transcript(['en'])
        except:
            print("🤖 No manual English subtitles found, trying auto-generated captions...")
            transcript = transcript_list.find_generated_transcript(['en'])
        
        transcript_data = transcript.fetch()
        raw_data = transcript_data.to_raw_data()
        
        # Create SRT file
        srt_content = create_srt(raw_data)
        srt_file.write_text(srt_content, encoding='utf-8')
        
        # Create Markdown file
        md_content = create_markdown(raw_data)
        md_file.write_text(md_content, encoding='utf-8')
        
        # Create JSON file
        json_content = create_json(raw_data)
        json_file.write_text(json_content, encoding='utf-8')
        
        print("✅ Transcript files saved to:", outdir)
        
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()