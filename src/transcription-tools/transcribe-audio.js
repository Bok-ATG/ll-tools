/**
 * Transcribe audio using OpenAI Whisper API with word-level timestamps
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function transcribeAudio(audioFilePath, options = {}) {
    const {
        model = 'whisper-1',
        language = 'en',
        responseFormat = 'verbose_json',
        timestampGranularities = ['word']
    } = options;
    
    console.log(`🎤 Transcribing audio: ${audioFilePath}`);
    console.log(`→ Model: ${model}`);
    console.log(`→ Language: ${language}`);
    console.log(`→ Response format: ${responseFormat}`);
    console.log(`→ Timestamp granularities: ${timestampGranularities.join(', ')}`);
    
    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
    }
    
    // Get file stats
    const stats = fs.statSync(audioFilePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    console.log(`→ File size: ${fileSizeMB.toFixed(2)} MB`);
    
    if (fileSizeMB > 25) {
        throw new Error('File size exceeds OpenAI limit of 25MB. Consider using a shorter video or compressing the audio.');
    }
    
    try {
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioFilePath),
            model: model,
            language: language,
            response_format: responseFormat,
            timestamp_granularities: timestampGranularities
        });
        
        console.log(`✅ Transcription completed!`);
        console.log(`→ Duration: ${transcription.duration?.toFixed(2)}s`);
        console.log(`→ Words: ${transcription.words?.length || 'N/A'}`);
        
        return transcription;
        
    } catch (error) {
        if (error.code === 'file_too_large') {
            throw new Error('Audio file is too large. OpenAI has a 25MB limit.');
        } else if (error.code === 'invalid_file_format') {
            throw new Error('Invalid audio file format. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm');
        } else {
            throw new Error(`OpenAI API error: ${error.message}`);
        }
    }
}

async function saveWhisperTranscriptionResults(transcription, videoId, outputDir = null) {
    // Use provided outputDir or get from folder utils
    let transcriptionsDir;
    if (outputDir) {
        transcriptionsDir = outputDir;
    } else {
        const { getOutputPaths } = require('./folder-utils');
        const paths = getOutputPaths(videoId);
        transcriptionsDir = paths.whisperTranscriptions;
    }
    
    await fs.promises.mkdir(transcriptionsDir, { recursive: true });
    
    // Save raw JSON
    const jsonFile = path.join(transcriptionsDir, `${videoId}_raw_transcription.json`);
    await fs.promises.writeFile(jsonFile, JSON.stringify(transcription, null, 2));
    console.log(`💾 Whisper raw transcription saved: ${jsonFile}`);
    
    // Save word-level timestamps as SRT-style format
    let srtFile = null;
    if (transcription.words) {
        srtFile = path.join(transcriptionsDir, `${videoId}_word_timestamps.srt`);
        const srtContent = createWordLevelSRT(transcription.words);
        await fs.promises.writeFile(srtFile, srtContent);
        console.log(`💾 Whisper word-level SRT saved: ${srtFile}`);
    }
    
    // Save plain text
    const txtFile = path.join(transcriptionsDir, `${videoId}_transcript.txt`);
    await fs.promises.writeFile(txtFile, transcription.text);
    console.log(`💾 Whisper plain text saved: ${txtFile}`);
    
    return {
        jsonFile,
        srtFile,
        txtFile
    };
}

async function transcribeAudioWithGPT4o(audioFilePath, options = {}) {
    const {
        model = 'gpt-4o-audio-preview',
        instructions = `Please transcribe this audio accurately with the following formatting:

1. Identify different speakers and label them (Speaker 1, Speaker 2, etc. or use names if mentioned)
2. Format as a conversation with clear speaker attribution
3. Preserve natural speech patterns and structure
4. Use proper punctuation and paragraph breaks
5. If there are interruptions, overlapping speech, or unclear sections, note them appropriately

Format example:
**Speaker 1:** [content]

**Speaker 2:** [content]

Be detailed in capturing the nuances of the conversation while maintaining readability.`
    } = options;
    
    console.log(`🤖 Transcribing audio with GPT-4o: ${audioFilePath}`);
    console.log(`→ Model: ${model}`);
    console.log(`→ Instructions: ${instructions}`);
    
    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
    }
    
    // Get file stats
    const stats = fs.statSync(audioFilePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    console.log(`→ File size: ${fileSizeMB.toFixed(2)} MB`);
    
    if (fileSizeMB > 25) {
        throw new Error('File size exceeds OpenAI limit of 25MB. Consider using a shorter video or compressing the audio.');
    }
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: instructions
                        },
                        {
                            type: 'input_audio',
                            input_audio: {
                                data: fs.readFileSync(audioFilePath).toString('base64'),
                                format: 'mp3'
                            }
                        }
                    ]
                }
            ]
        });
        
        const transcription = {
            text: response.choices[0].message.content,
            model: model,
            usage: response.usage
        };
        
        console.log(`✅ GPT-4o transcription completed!`);
        console.log(`→ Text length: ${transcription.text.length} characters`);
        console.log(`→ Tokens used: ${response.usage?.total_tokens || 'N/A'}`);
        
        return transcription;
        
    } catch (error) {
        throw new Error(`OpenAI GPT-4o API error: ${error.message}`);
    }
}

async function saveGPT4oTranscriptionResults(transcription, videoId, outputDir = null) {
    // Use provided outputDir or get from folder utils
    let transcriptionsDir;
    if (outputDir) {
        transcriptionsDir = outputDir;
    } else {
        const { getOutputPaths } = require('./folder-utils');
        const paths = getOutputPaths(videoId);
        transcriptionsDir = paths.gpt4oTranscriptions;
    }
    
    await fs.promises.mkdir(transcriptionsDir, { recursive: true });
    
    // Save raw JSON
    const jsonFile = path.join(transcriptionsDir, `${videoId}_raw_transcription.json`);
    await fs.promises.writeFile(jsonFile, JSON.stringify(transcription, null, 2));
    console.log(`💾 GPT-4o raw transcription saved: ${jsonFile}`);
    
    // Save plain text
    const txtFile = path.join(transcriptionsDir, `${videoId}_transcript.txt`);
    await fs.promises.writeFile(txtFile, transcription.text);
    console.log(`💾 GPT-4o plain text saved: ${txtFile}`);
    
    return {
        jsonFile,
        txtFile
    };
}

// Keep old function name for backward compatibility
async function saveTranscriptionResults(transcription, videoId, outputDir = null) {
    return await saveWhisperTranscriptionResults(transcription, videoId, outputDir);
}

function createWordLevelSRT(words) {
    const srtLines = [];
    let index = 1;
    
    // Group words into reasonable chunks (every ~10 words or 5 seconds)
    const chunks = [];
    let currentChunk = [];
    let chunkStartTime = null;
    
    words.forEach((word, i) => {
        if (chunkStartTime === null) {
            chunkStartTime = word.start;
        }
        
        currentChunk.push(word);
        
        // End chunk if we have 10 words or 5 seconds have passed
        const shouldEndChunk = currentChunk.length >= 10 || 
                              (word.end - chunkStartTime >= 5) ||
                              i === words.length - 1;
        
        if (shouldEndChunk) {
            chunks.push({
                words: [...currentChunk],
                start: chunkStartTime,
                end: word.end
            });
            currentChunk = [];
            chunkStartTime = null;
        }
    });
    
    chunks.forEach(chunk => {
        const startTime = formatSRTTime(chunk.start);
        const endTime = formatSRTTime(chunk.end);
        const text = chunk.words.map(w => w.word).join('');
        
        srtLines.push(index);
        srtLines.push(`${startTime} --> ${endTime}`);
        srtLines.push(text);
        srtLines.push('');
        
        index++;
    });
    
    return srtLines.join('\n');
}

function formatSRTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
}

module.exports = { 
    transcribeAudio, 
    transcribeAudioWithGPT4o,
    saveTranscriptionResults,
    saveWhisperTranscriptionResults,
    saveGPT4oTranscriptionResults,
    createWordLevelSRT,
    formatSRTTime 
};