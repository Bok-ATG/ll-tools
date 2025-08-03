# ll-tools

A comprehensive suite of command line tools for content processing and analysis.

## 🚀 Quick Start

```bash
# Install dependencies and link globally
npm install
npm link

# Set up environment variables
cp .env.cli.example .env.cli
# Edit .env.cli with your API keys and output folder
```

## 🎯 Features

### YouTube Transcription Pipeline
Transform YouTube videos into comprehensive content analysis with multiple AI models:

- **Multi-Model Transcription**: Whisper + GPT-4o + Structured Analysis
- **20+ Output Formats**: Transcripts, summaries, social media content, blog posts, study guides
- **Advanced Analysis**: Sentiment, action items, key quotes, SEO keywords, chapter markers
- **Auto-Detection**: Content type and industry classification
- **Professional Quality**: Publication-ready outputs for various use cases

## 📋 Usage Examples

### Basic Transcription
```bash
# Simple transcription with basic formatting
ll --ytTranscript "https://www.youtube.com/watch?v=VIDEO_ID"
```

### Comprehensive Analysis
```bash
# Full analysis suite (generates 20+ files)
ll --ytTranscript "https://www.youtube.com/watch?v=VIDEO_ID" --analysis full
```

### Custom Analysis
```bash
# Selective analysis features
ll --ytTranscript "URL" --analysis custom --sentiment --social --keywords --blogPost

# Override auto-detection
ll --ytTranscript "URL" --contentType interview --industry tech
```

### Output Options
- `--analysis basic` - Standard transcription + summary
- `--analysis full` - Complete analysis suite (11 analysis types)
- `--analysis custom` - Use individual flags to select features

### Available Analysis Flags
- `--sentiment` - Emotional tone analysis
- `--actionItems` - Extract tasks and decisions
- `--quotes` - Key quotable statements
- `--social` - Social media content (Twitter, LinkedIn, Instagram)
- `--keywords` - SEO keywords and hashtags
- `--chapters` - Chapter markers with timestamps
- `--blogPost` - SEO-optimized blog article
- `--newsletter` - Email newsletter format
- `--faq` - Frequently asked questions
- `--discussion` - Discussion questions for education
- `--studyGuide` - Educational study materials

## 📁 Output Structure

```
OUTPUT_FOLDER/
├── downloads/           # Audio files
├── transcriptions/      # Raw transcriptions
│   ├── whisper/        # Word-level precision
│   ├── 4o/             # Speaker identification
│   └── structured/     # JSON schema-validated
└── formatted/          # Analysis & formatted content
    ├── _formatted.md   # Comprehensive document
    ├── _summary.md     # Executive summary
    ├── _blog_post.md   # SEO blog article
    ├── _social_media.md # Platform-specific posts
    ├── _study_guide.md  # Educational materials
    └── ...             # 15+ additional formats
```

## ⚙️ Configuration

### Environment Variables (.env.cli)
```bash
OUTPUT_FOLDER=/path/to/output/directory
OPENAI_API_KEY=sk-your-api-key-here
```

### Dependencies
- `yt-dlp` - YouTube audio download
- `openai` - AI model integration
- Node.js 14+ 

## 🎨 Use Cases

### Content Creators
- Generate captions, blog posts, and social media content
- Extract key quotes for promotional materials
- Create chapter markers for video navigation

### Educators  
- Convert lectures into study guides and discussion questions
- Generate educational materials from video content
- Create accessible transcripts with speaker identification

### Businesses
- Extract action items from recorded meetings
- Generate marketing content from webinars
- Analyze sentiment and engagement metrics

### Researchers
- Process interview data with speaker diarization
- Generate structured datasets for analysis
- Create comprehensive documentation

## 📚 Documentation

- **Comprehensive Guide**: [/docs/how-to/transcription-tools.md](./docs/how-to/transcription-tools.md)
- **API Reference**: See individual module documentation in `/src/transcription-tools/`

## 🛠️ Development

Add `[DEV_FOLDER]/ll-tools/scripts` to your `$PATH` for additional shell and Python scripts in `/scripts`. The main entry point is `./cli.js` accessible via `ll` command after running `npm link`.

## 📈 Performance

- **Parallel Processing**: Multiple AI analyses run concurrently
- **Smart Caching**: Efficient file handling and reuse
- **Error Recovery**: Comprehensive error handling and graceful degradation
- **Cost Optimization**: Efficient prompt design for API usage
