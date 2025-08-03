# YouTube Transcription Tools

A comprehensive suite of tools for downloading, transcribing, and analyzing YouTube videos using multiple AI models and advanced content processing.

## 🎯 Overview

This toolkit provides a complete pipeline for YouTube content processing:

1. **Audio Download** - YouTube video to high-quality audio extraction
2. **Multi-Model Transcription** - Parallel processing with Whisper, GPT-4o, and structured analysis
3. **Advanced Analysis** - Content analysis, sentiment, SEO optimization, and format conversion
4. **Comprehensive Output** - Multiple formats for different use cases

## 🏗️ Architecture

```
YouTube URL → Audio Download → Multi-Model Transcription → Advanced Analysis → Multiple Outputs
```

### Core Components

```
src/transcription-tools/
├── cli.js                      # Main CLI orchestrator
├── download-yt-video.js        # YouTube audio extraction
├── transcribe-audio.js         # Multi-model transcription
├── structured-transcription.js # JSON schema-validated analysis  
├── format-transcript.js        # Advanced formatting & analysis
└── folder-utils.js            # File organization utilities
```

## 🚀 Quick Start

```bash
# Install and link globally
npm install
npm link

# Basic transcription
ll --ytTranscript "https://www.youtube.com/watch?v=VIDEO_ID"

# With comprehensive analysis
ll --ytTranscript "https://www.youtube.com/watch?v=VIDEO_ID" --analysis full
```

## 📋 Pipeline Steps

### Step 0: Folder Setup
- Creates organized output structure with environment variables
- Folders: downloads, transcriptions/{whisper,4o,structured}, formatted

### Step 1: Audio Download (`download-yt-video.js`)
- Uses `yt-dlp` for reliable YouTube audio extraction
- Outputs high-quality MP3 files
- Handles various YouTube URL formats
- **Output**: `{video_id}.mp3`

### Step 2: Multi-Model Transcription

#### 2a: Whisper Transcription (`transcribe-audio.js`)
- **Model**: `whisper-1`
- **Specialization**: Word-level precision with exact timestamps
- **Features**: Word boundaries, duration tracking, multi-language support
- **Outputs**:
  - `{video_id}_raw_transcription.json` - Full API response with word timestamps
  - `{video_id}_word_timestamps.srt` - Word-level subtitle file
  - `{video_id}_transcript.txt` - Clean text transcript

#### 2b: GPT-4o Audio Transcription (`transcribe-audio.js`)
- **Model**: `gpt-4o-audio-preview`
- **Specialization**: Speaker identification and conversation formatting
- **Features**: Natural language processing, speaker diarization, conversation flow
- **Outputs**:
  - `{video_id}_raw_transcription.json` - Formatted conversation with speakers
  - `{video_id}_transcript.txt` - Speaker-attributed text

#### 2c: Structured Transcription (`structured-transcription.js`)
- **Models**: `whisper-1` + `gpt-4o`
- **Specialization**: JSON schema-validated speaker segments
- **Features**: Time estimates, metadata, speaker timeline
- **Outputs**:
  - `{video_id}_structured_transcription.json` - Schema-validated JSON
  - `{video_id}_speaker_timestamps.srt` - Speaker-aware subtitles
  - `{video_id}_conversation.txt` - Formatted conversation transcript
  - `{video_id}_speaker_timeline.json` - Speaker analysis and flow

### Step 3: Advanced Analysis & Formatting (`format-transcript.js`)

## 🎨 Content Processing Features

### Auto-Detection Systems

#### Content Type Detection
- **Interview**: Q&A format with interviewer/interviewee roles
- **Lecture**: Educational structure with learning objectives
- **Meeting**: Action items, decisions, and next steps
- **Podcast**: Quotable moments and key insights
- **Discussion**: General conversation format
- **Monologue**: Single speaker presentation

#### Industry Detection
- **Tech**: APIs, algorithms, software development, AI/ML
- **Business**: Strategy, metrics, ROI, market analysis
- **Education**: Learning objectives, curriculum, pedagogy
- **Health**: Medical terms, treatments, clinical research
- **Finance**: Investment, market analysis, financial metrics
- **Marketing**: Campaigns, conversion, customer insights

### Advanced Analysis Functions

#### 1. Sentiment Analysis (`analyzeSentiment`)
```javascript
// Emotional tone and sentiment progression
- Overall sentiment classification (positive/negative/neutral)
- Sentiment changes throughout conversation
- Emotional peaks and notable moments
- Per-speaker sentiment assessment
- Confidence scores
```

#### 2. Action Items Extraction (`extractActionItems`)
```javascript
// Task and commitment identification
- Specific actionable items with ownership
- Deadlines and timeframes
- Decisions made during conversation
- Follow-up requirements
- Urgency/importance categorization
```

#### 3. Key Quotes Extraction (`extractKeyQuotes`)
```javascript
// Impactful and quotable statements
- Most memorable quotes (configurable count)
- Speaker attribution
- Context and significance
- Social sharing optimization
- Wisdom and insight focus
```

#### 4. Social Media Content (`generateSocialContent`)
```javascript
// Platform-optimized content
- Twitter/X: 280 chars with hashtags
- LinkedIn: Professional 1-2 paragraphs
- Instagram: Visual-friendly with emojis
- Platform-specific hashtag strategies
- Engagement optimization
```

#### 5. SEO & Keywords (`extractKeywords`)
```javascript
// Search optimization and discoverability
- Primary and secondary keywords
- Topic categorization
- Hashtag generation
- Search intent alignment
- Content discoverability enhancement
```

#### 6. Chapter Markers (`createChapterMarkers`)
```javascript
// Content structure and navigation
- Logical chapter division (configurable count)
- Timestamp estimation (MM:SS format)
- Descriptive chapter titles
- Chapter content summaries
- Navigation optimization
```

### Content Format Generation

#### 7. Blog Post (`generateBlogPost`)
```javascript
// SEO-optimized blog content
- Engaging headlines and introductions
- Clear heading structure
- Smooth transitions between sections
- Compelling conclusions with takeaways
- Natural keyword integration
```

#### 8. Newsletter Format (`generateNewsletter`)
```javascript
// Email-optimized content
- Newsletter-style headlines
- Scannable section structure
- Key takeaways sections
- Forward-friendly conclusions
- Conversational tone
```

#### 9. FAQ Generation (`generateFAQ`)
```javascript
// Common questions and answers
- 5-8 likely reader questions
- Clear, concise answers
- Explicit and implicit information
- Natural question phrasing
- Comprehensive coverage
```

#### 10. Discussion Questions (`generateDiscussionQuestions`)
```javascript
// Educational and engagement tools
- Open-ended critical thinking questions
- Multiple perspective encouragement
- Beyond-content application
- Varied question types (analytical, hypothetical, comparative)
- Thought-provoking design
```

#### 11. Study Guide (`generateStudyGuide`)
```javascript
// Educational resource creation
- Key terms and definitions
- Main concepts and themes
- Varying difficulty review questions
- Practical applications and examples
- Learning retention optimization
```

## 🔧 Advanced Configuration

### Comprehensive Analysis Options
```javascript
const options = {
    model: 'gpt-4o',
    enableSentiment: true,      // Sentiment analysis
    enableActionItems: true,    // Task extraction
    enableQuotes: true,         // Key quotes
    enableSocial: true,         // Social media content
    enableKeywords: true,       // SEO keywords
    enableChapters: true,       // Chapter markers
    enableBlogPost: true,       // Blog format
    enableNewsletter: true,     // Newsletter format
    enableFAQ: true,           // FAQ generation
    enableDiscussion: true,     // Discussion questions
    enableStudyGuide: true,     // Study guide
    videoTitle: 'Custom Title'
};
```

### Content Type Override
```javascript
const formatOptions = {
    contentType: 'interview',   // Override auto-detection
    industry: 'tech',          // Override auto-detection
    includeTimestamps: true,   // Preserve timing info
    videoTitle: 'Custom Title'
};
```

## 📁 Output Structure

```
OUTPUT_FOLDER/
├── downloads/
│   └── {video_id}.mp3
├── transcriptions/
│   ├── whisper/
│   │   ├── {video_id}_raw_transcription.json
│   │   ├── {video_id}_word_timestamps.srt
│   │   └── {video_id}_transcript.txt
│   ├── 4o/
│   │   ├── {video_id}_raw_transcription.json
│   │   └── {video_id}_transcript.txt
│   └── structured/
│       ├── {video_id}_structured_transcription.json
│       ├── {video_id}_speaker_timestamps.srt
│       ├── {video_id}_conversation.txt
│       └── {video_id}_speaker_timeline.json
└── formatted/
    ├── {video_id}_formatted.md              # Comprehensive document
    ├── {video_id}_summary.md                # Executive summary
    ├── {video_id}_sentiment_analysis.md     # Sentiment analysis
    ├── {video_id}_action_items.md           # Action items
    ├── {video_id}_key_quotes.md             # Key quotes
    ├── {video_id}_social_media.md           # Social content
    ├── {video_id}_keywords.md               # SEO keywords
    ├── {video_id}_chapters.md               # Chapter markers
    ├── {video_id}_blog_post.md              # Blog format
    ├── {video_id}_newsletter.md             # Newsletter format
    ├── {video_id}_faq.md                    # FAQ
    ├── {video_id}_discussion_questions.md   # Discussion questions
    └── {video_id}_study_guide.md            # Study guide
```

## 🎯 Use Cases

### Content Creators
- **Video Transcription**: Accurate captions and transcripts
- **Content Repurposing**: Blog posts, newsletters, social media
- **SEO Optimization**: Keywords and chapter markers
- **Engagement**: Discussion questions and quotes

### Educators
- **Course Materials**: Study guides and discussion questions
- **Content Analysis**: Key concepts and learning objectives
- **Assessment Tools**: Review questions and comprehension checks
- **Accessibility**: Multiple format accessibility

### Businesses
- **Meeting Documentation**: Action items and decisions
- **Content Marketing**: Social media and blog content
- **Training Materials**: Educational resources and guides
- **Analysis**: Sentiment and engagement insights

### Researchers
- **Data Analysis**: Sentiment and content analysis
- **Documentation**: Comprehensive transcription and analysis
- **Publication**: Multiple format outputs for different audiences
- **Collaboration**: Structured data for team analysis

## 🔧 Technical Details

### Models Used
- **Whisper-1**: Word-level precision transcription
- **GPT-4o-audio-preview**: Speaker identification and conversation formatting
- **GPT-4o**: Text analysis, structured outputs, and content generation

### Performance Optimizations
- **Parallel Processing**: Multiple analyses run concurrently
- **Efficient File Handling**: Optimized I/O operations
- **Error Handling**: Comprehensive error recovery
- **Token Management**: Optimized prompt design for cost efficiency

### Dependencies
- `openai`: AI model integration
- `yt-dlp`: YouTube audio download
- `yargs`: CLI argument parsing
- `dotenv`: Environment configuration

## 🌟 Advanced Features

### JSON Schema Validation
Structured transcription uses strict JSON schema validation for:
- Speaker segment timing
- Metadata consistency
- Type safety
- API integration compatibility

### Environment Configuration
```bash
# .env.cli
OUTPUT_FOLDER=/path/to/output
OPENAI_API_KEY=sk-...
```

### Error Recovery
- Automatic retry mechanisms
- Graceful degradation
- Comprehensive error logging
- Recovery suggestions

### Extensibility
- Modular architecture for easy extension
- Plugin-ready format
- API-first design
- Custom analysis integration

## 📈 Future Enhancements

### Planned Features
- **Multi-language Support**: Automatic language detection and translation
- **Video Analysis**: Visual content analysis integration
- **Real-time Processing**: Live stream transcription
- **API Integration**: RESTful API for programmatic access
- **Custom Models**: Fine-tuned model integration
- **Batch Processing**: Multiple video processing
- **Advanced Analytics**: Deeper content insights
- **Export Formats**: Additional output formats (PDF, DOCX, etc.)

### Integration Opportunities
- **CMS Integration**: WordPress, Notion, etc.
- **Social Platform APIs**: Direct posting to social media
- **Learning Management Systems**: LMS integration
- **Analytics Platforms**: Data pipeline integration
- **Collaboration Tools**: Slack, Teams, Discord integration

## 🛠️ Development

### Adding New Analysis Functions
```javascript
// Template for new analysis function
async function newAnalysisFunction(transcriptionText, options = {}) {
    const { model = 'gpt-4o' } = options;
    
    console.log(`🔍 Running new analysis...`);
    
    const systemPrompt = `Your analysis instructions here...`;
    const userPrompt = `Analyze this transcript: ${transcriptionText}`;
    
    try {
        const response = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1000
        });
        
        console.log(`✅ New analysis completed!`);
        return response.choices[0].message.content;
        
    } catch (error) {
        throw new Error(`New analysis error: ${error.message}`);
    }
}
```

### Adding New Content Types
```javascript
// Add to CONTENT_TYPES object
const CONTENT_TYPES = {
    newType: ['keyword1', 'keyword2', 'keyword3'],
    // ... existing types
};
```

### Adding New Industries
```javascript
// Add to INDUSTRY_PROMPTS object
const INDUSTRY_PROMPTS = {
    newIndustry: "Focus instructions for new industry...",
    // ... existing industries
};
```

---

*This toolkit represents a comprehensive solution for YouTube content processing, combining multiple AI models with advanced analysis capabilities to transform video content into valuable, multi-format resources.*