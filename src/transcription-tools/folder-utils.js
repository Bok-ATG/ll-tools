/**
 * Utility functions for managing output folder structure
 */

const fs = require('fs').promises;
const path = require('path');

async function ensureOutputFolders() {
    const baseOutputFolder = process.env.OUTPUT_FOLDER;
    
    if (!baseOutputFolder) {
        throw new Error('OUTPUT_FOLDER environment variable not set');
    }
    
    // Define subfolder structure
    const folders = {
        base: baseOutputFolder,
        downloads: path.join(baseOutputFolder, 'downloads'),
        transcriptions: path.join(baseOutputFolder, 'transcriptions'),
        whisperTranscriptions: path.join(baseOutputFolder, 'transcriptions', 'whisper'),
        gpt4oTranscriptions: path.join(baseOutputFolder, 'transcriptions', '4o'),
        structuredTranscriptions: path.join(baseOutputFolder, 'transcriptions', 'structured'),
        formatted: path.join(baseOutputFolder, 'formatted')
    };
    
    // Create all folders
    for (const [key, folderPath] of Object.entries(folders)) {
        try {
            await fs.mkdir(folderPath, { recursive: true });
            console.log(`📁 Ensured folder exists: ${folderPath}`);
        } catch (error) {
            throw new Error(`Failed to create folder ${folderPath}: ${error.message}`);
        }
    }
    
    return folders;
}

function getOutputPaths(videoId) {
    const baseOutputFolder = process.env.OUTPUT_FOLDER;
    
    if (!baseOutputFolder) {
        throw new Error('OUTPUT_FOLDER environment variable not set');
    }
    
    return {
        downloads: path.join(baseOutputFolder, 'downloads'),
        transcriptions: path.join(baseOutputFolder, 'transcriptions'),
        whisperTranscriptions: path.join(baseOutputFolder, 'transcriptions', 'whisper'),
        gpt4oTranscriptions: path.join(baseOutputFolder, 'transcriptions', '4o'),
        structuredTranscriptions: path.join(baseOutputFolder, 'transcriptions', 'structured'),
        formatted: path.join(baseOutputFolder, 'formatted'),
        
        // Specific file paths
        audioFile: path.join(baseOutputFolder, 'downloads', `${videoId}.mp3`),
        
        // Whisper files
        whisperRawJsonFile: path.join(baseOutputFolder, 'transcriptions', 'whisper', `${videoId}_raw_transcription.json`),
        whisperWordSrtFile: path.join(baseOutputFolder, 'transcriptions', 'whisper', `${videoId}_word_timestamps.srt`),
        whisperPlainTextFile: path.join(baseOutputFolder, 'transcriptions', 'whisper', `${videoId}_transcript.txt`),
        
        // GPT-4o files
        gpt4oRawJsonFile: path.join(baseOutputFolder, 'transcriptions', '4o', `${videoId}_raw_transcription.json`),
        gpt4oPlainTextFile: path.join(baseOutputFolder, 'transcriptions', '4o', `${videoId}_transcript.txt`),
        
        // Formatted files
        formattedMarkdownFile: path.join(baseOutputFolder, 'formatted', `${videoId}_formatted.md`),
        summaryFile: path.join(baseOutputFolder, 'formatted', `${videoId}_summary.md`)
    };
}

module.exports = {
    ensureOutputFolders,
    getOutputPaths
};