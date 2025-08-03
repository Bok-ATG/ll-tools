/**
 * Download YouTube video as audio for transcription
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

function extractVideoId(urlOrId) {
    // If it's already an 11-character alphanumeric string, assume it's a video ID
    if (urlOrId.length === 11 && /^[a-zA-Z0-9_-]+$/.test(urlOrId)) {
        return urlOrId;
    }
    
    // Try to extract from various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
        const match = urlOrId.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    return null;
}

async function downloadYouTubeAudio(url, outputDir = null) {
    const vid = extractVideoId(url);
    
    if (!vid) {
        throw new Error(`Couldn't extract video ID from '${url}'`);
    }
    
    // Use provided outputDir or get from folder utils
    let outdir;
    if (outputDir) {
        outdir = outputDir;
    } else {
        const { getOutputPaths } = require('./folder-utils');
        const paths = getOutputPaths(vid);
        outdir = paths.downloads;
    }
    
    await fs.mkdir(outdir, { recursive: true });
    
    // Output file path
    const outputPath = path.join(outdir, `${vid}.%(ext)s`);
    
    console.log(`📥 Downloading audio from: ${url}`);
    console.log(`→ Output directory: ${outdir}`);
    
    return new Promise((resolve, reject) => {
        const args = [
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '192K',
            '--output', outputPath,
            url
        ];
        
        console.log(`🎵 Running: yt-dlp ${args.join(' ')}`);
        
        const process = spawn('yt-dlp', args, {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
            stdout += data.toString();
            // Log progress in real-time
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    console.log(line.trim());
                }
            });
        });
        
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                // Find the actual downloaded file
                const expectedFile = path.join(outdir, `${vid}.mp3`);
                resolve({
                    success: true,
                    audioFile: expectedFile,
                    videoId: vid,
                    stdout,
                    stderr
                });
            } else {
                reject(new Error(`yt-dlp failed with code ${code}: ${stderr}`));
            }
        });
        
        process.on('error', (error) => {
            reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
        });
    });
}

module.exports = { downloadYouTubeAudio, extractVideoId };