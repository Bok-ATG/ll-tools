/**
 * Structured transcription using GPT-4o with defined schema
 * Combines speaker diarization with time estimates
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Define the structured output schema
const transcriptionSchema = {
    type: "object",
    properties: {
        segments: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    speaker: {
                        type: "string",
                        description: "Speaker identifier (e.g., 'Speaker 1', 'Speaker 2', or actual name if mentioned)"
                    },
                    text: {
                        type: "string", 
                        description: "The text spoken by this speaker in this segment"
                    },
                    start_time: {
                        type: "string",
                        description: "Estimated start time in MM:SS.s format (e.g., '02:45.3')"
                    },
                    end_time: {
                        type: "string",
                        description: "Estimated end time in MM:SS.s format (e.g., '02:52.1')"
                    }
                },
                required: ["speaker", "text", "start_time", "end_time"],
                additionalProperties: false
            }
        },
        metadata: {
            type: "object",
            properties: {
                total_speakers: {
                    type: "number",
                    description: "Total number of distinct speakers identified"
                },
                conversation_type: {
                    type: "string",
                    description: "Type of conversation (e.g., 'interview', 'discussion', 'monologue')"
                },
                audio_quality: {
                    type: "string", 
                    enum: ["excellent", "good", "fair", "poor"],
                    description: "Subjective assessment of audio quality"
                }
            },
            required: ["total_speakers", "conversation_type", "audio_quality"],
            additionalProperties: false
        }
    },
    required: ["segments", "metadata"],
    additionalProperties: false
};

async function createStructuredTranscription(audioFilePath, options = {}) {
    const {
        model = 'gpt-4o'
    } = options;
    
    console.log(`🎯 Creating structured transcription: ${audioFilePath}`);
    console.log(`→ Model: ${model}`);
    
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
    
    const instructions = `Analyze this audio and provide a structured transcription with speaker diarization and time estimates.

INSTRUCTIONS:
1. Identify all distinct speakers and label them consistently (Speaker 1, Speaker 2, etc.)
2. Break the conversation into natural segments based on speaker turns
3. Estimate start and end times for each segment based on the audio timing
4. Provide clean, readable text for each segment
5. Include metadata about the conversation

Be as accurate as possible with timing estimates - listen carefully to when each speaker starts and stops talking.

Format times as MM:SS.s (e.g., "02:45.3" for 2 minutes 45.3 seconds).`;

    try {
        const response = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioFilePath),
            model: 'whisper-1',
            response_format: 'json',
            language: 'en'
        });
        
        // Now use GPT-4o with text to create structured output
        const structuredResponse = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: 'user',
                    content: `${instructions}

Here is the raw transcript:
"${response.text}"`
                }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "structured_transcription",
                    schema: transcriptionSchema,
                    strict: true
                }
            }
        });
        
        const structuredData = JSON.parse(structuredResponse.choices[0].message.content);
        
        const result = {
            ...structuredData,
            model: model,
            usage: structuredResponse.usage,
            created_at: new Date().toISOString()
        };
        
        console.log(`✅ Structured transcription completed!`);
        console.log(`→ Segments: ${result.segments.length}`);
        console.log(`→ Speakers: ${result.metadata.total_speakers}`);
        console.log(`→ Type: ${result.metadata.conversation_type}`);
        console.log(`→ Tokens used: ${structuredResponse.usage?.total_tokens || 'N/A'}`);
        
        return result;
        
    } catch (error) {
        throw new Error(`OpenAI structured transcription error: ${error.message}`);
    }
}

async function saveStructuredTranscriptionResults(structuredData, videoId, outputDir = null) {
    // Use provided outputDir or get from folder utils
    let structuredDir;
    if (outputDir) {
        structuredDir = outputDir;
    } else {
        const { getOutputPaths } = require('./folder-utils');
        const paths = getOutputPaths(videoId);
        structuredDir = paths.structuredTranscriptions;
    }
    
    await fs.promises.mkdir(structuredDir, { recursive: true });
    
    // Save raw structured JSON
    const jsonFile = path.join(structuredDir, `${videoId}_structured_transcription.json`);
    await fs.promises.writeFile(jsonFile, JSON.stringify(structuredData, null, 2));
    console.log(`💾 Structured transcription saved: ${jsonFile}`);
    
    // Create speaker-aware SRT file
    const srtFile = path.join(structuredDir, `${videoId}_speaker_timestamps.srt`);
    const srtContent = createSpeakerSRT(structuredData.segments);
    await fs.promises.writeFile(srtFile, srtContent);
    console.log(`💾 Speaker-aware SRT saved: ${srtFile}`);
    
    // Create conversation transcript
    const txtFile = path.join(structuredDir, `${videoId}_conversation.txt`);
    const conversationText = createConversationText(structuredData);
    await fs.promises.writeFile(txtFile, conversationText);
    console.log(`💾 Conversation transcript saved: ${txtFile}`);
    
    // Create speaker timeline
    const timelineFile = path.join(structuredDir, `${videoId}_speaker_timeline.json`);
    const timeline = createSpeakerTimeline(structuredData.segments);
    await fs.promises.writeFile(timelineFile, JSON.stringify(timeline, null, 2));
    console.log(`💾 Speaker timeline saved: ${timelineFile}`);
    
    return {
        jsonFile,
        srtFile,
        txtFile,
        timelineFile
    };
}

function createSpeakerSRT(segments) {
    const srtLines = [];
    
    segments.forEach((segment, index) => {
        const startTime = convertToSRTTime(segment.start_time);
        const endTime = convertToSRTTime(segment.end_time);
        
        srtLines.push((index + 1).toString());
        srtLines.push(`${startTime} --> ${endTime}`);
        srtLines.push(`${segment.speaker}: ${segment.text}`);
        srtLines.push('');
    });
    
    return srtLines.join('\n');
}

function createConversationText(structuredData) {
    const lines = [
        `# Conversation Transcript`,
        ``,
        `**Metadata:**`,
        `- Speakers: ${structuredData.metadata.total_speakers}`,
        `- Type: ${structuredData.metadata.conversation_type}`,
        `- Audio Quality: ${structuredData.metadata.audio_quality}`,
        `- Generated: ${structuredData.created_at}`,
        ``,
        `---`,
        ``
    ];
    
    structuredData.segments.forEach(segment => {
        lines.push(`**${segment.speaker}** (${segment.start_time} - ${segment.end_time})`);
        lines.push(segment.text);
        lines.push('');
    });
    
    return lines.join('\n');
}

function createSpeakerTimeline(segments) {
    const speakers = {};
    
    segments.forEach(segment => {
        if (!speakers[segment.speaker]) {
            speakers[segment.speaker] = [];
        }
        
        speakers[segment.speaker].push({
            start_time: segment.start_time,
            end_time: segment.end_time,
            text: segment.text,
            duration: calculateDuration(segment.start_time, segment.end_time)
        });
    });
    
    return {
        speakers,
        conversation_flow: segments.map(s => ({
            speaker: s.speaker,
            start_time: s.start_time,
            end_time: s.end_time
        }))
    };
}

function convertToSRTTime(timeStr) {
    // Convert MM:SS.s to HH:MM:SS,mmm format
    const [minutes, seconds] = timeStr.split(':');
    const [wholeSecs, decimals] = seconds.split('.');
    
    const hours = Math.floor(parseInt(minutes) / 60);
    const mins = parseInt(minutes) % 60;
    const secs = parseInt(wholeSecs);
    const millis = parseInt((decimals || '0').padEnd(3, '0'));
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
}

function calculateDuration(startTime, endTime) {
    // Simple duration calculation in seconds
    const [startMins, startSecs] = startTime.split(':');
    const [endMins, endSecs] = endTime.split(':');
    
    const startTotal = parseInt(startMins) * 60 + parseFloat(startSecs);
    const endTotal = parseInt(endMins) * 60 + parseFloat(endSecs);
    
    return (endTotal - startTotal).toFixed(1) + 's';
}

module.exports = {
    createStructuredTranscription,
    saveStructuredTranscriptionResults,
    createSpeakerSRT,
    createConversationText,
    createSpeakerTimeline
};