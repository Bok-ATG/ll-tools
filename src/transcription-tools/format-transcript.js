/**
 * Advanced transcript formatting and analysis using OpenAI
 * Includes multiple output formats, content analysis, and industry-specific templates
 */

const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Content type detection patterns
const CONTENT_TYPES = {
    interview: ['interview', 'q&a', 'question', 'answer', 'interviewer', 'interviewee'],
    lecture: ['lecture', 'presentation', 'teaching', 'lesson', 'course', 'educational'],
    meeting: ['meeting', 'agenda', 'action item', 'next steps', 'decision', 'minutes'],
    podcast: ['podcast', 'episode', 'host', 'guest', 'show'],
    discussion: ['discussion', 'conversation', 'chat', 'talk'],
    monologue: ['monologue', 'speech', 'presentation', 'keynote']
};

// Industry-specific prompting
const INDUSTRY_PROMPTS = {
    tech: "Focus on technical concepts, frameworks, APIs, implementation details, and code examples",
    business: "Highlight strategies, metrics, ROI, business implications, and market insights", 
    education: "Structure with learning objectives, key concepts, exercises, and knowledge checks",
    health: "Emphasize evidence-based information, practical applications, and safety considerations",
    finance: "Focus on financial metrics, market analysis, investment strategies, and risk factors",
    marketing: "Highlight campaigns, customer insights, conversion metrics, and growth strategies"
};

// Content type detection
function detectContentType(text) {
    const lowerText = text.toLowerCase();
    
    for (const [type, keywords] of Object.entries(CONTENT_TYPES)) {
        const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
        if (matches >= 2) return type;
    }
    
    // Default detection based on patterns
    if (lowerText.includes('speaker 1') && lowerText.includes('speaker 2')) {
        return 'interview';
    }
    return 'discussion';
}

// Industry detection
function detectIndustry(text) {
    const lowerText = text.toLowerCase();
    
    const industryKeywords = {
        tech: ['api', 'code', 'software', 'algorithm', 'data', 'ai', 'machine learning', 'programming'],
        business: ['revenue', 'profit', 'strategy', 'market', 'customer', 'sales', 'roi'],
        education: ['learn', 'student', 'course', 'curriculum', 'education', 'teaching'],
        health: ['patient', 'medical', 'health', 'treatment', 'diagnosis', 'clinical'],
        finance: ['investment', 'portfolio', 'financial', 'stocks', 'bonds', 'market'],
        marketing: ['campaign', 'brand', 'advertising', 'conversion', 'engagement']
    };
    
    let maxMatches = 0;
    let detectedIndustry = 'general';
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
        const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedIndustry = industry;
        }
    }
    
    return detectedIndustry;
}

async function formatTranscriptToMarkdown(transcriptionText, options = {}) {
    const {
        model = 'gpt-4o',
        includeTimestamps = false,
        videoTitle = null,
        contentType = null,
        industry = null
    } = options;
    
    // Auto-detect content type and industry if not provided
    const detectedContentType = contentType || detectContentType(transcriptionText);
    const detectedIndustry = industry || detectIndustry(transcriptionText);
    
    console.log(`📝 Formatting transcript to markdown...`);
    console.log(`→ Model: ${model}`);
    console.log(`→ Content type: ${detectedContentType}`);
    console.log(`→ Industry: ${detectedIndustry}`);
    console.log(`→ Include timestamps: ${includeTimestamps}`);
    
    // Build context-aware system prompt
    let contextPrompt = '';
    if (detectedContentType === 'interview') {
        contextPrompt = '\nFormat as Q&A with clear interviewer/interviewee roles. Use > blockquotes for questions.';
    } else if (detectedContentType === 'lecture') {
        contextPrompt = '\nCreate educational structure with learning objectives and key concepts. Use numbered lists for sequential concepts.';
    } else if (detectedContentType === 'meeting') {
        contextPrompt = '\nInclude action items, decisions, and next steps in separate sections. Use checkboxes for actionable items.';
    } else if (detectedContentType === 'podcast') {
        contextPrompt = '\nHighlight quotable moments and key insights. Use callout boxes for important quotes.';
    }
    
    // Add industry-specific instructions
    if (INDUSTRY_PROMPTS[detectedIndustry]) {
        contextPrompt += `\n\nINDUSTRY FOCUS: ${INDUSTRY_PROMPTS[detectedIndustry]}`;
    }
    
    const systemPrompt = `You are a transcript formatting expert specializing in ${detectedContentType} content for the ${detectedIndustry} industry. Your task is to take a raw transcript and format it into well-structured, readable markdown.

INSTRUCTIONS:
1. Add appropriate headers and structure to organize the content
2. Break into logical sections based on topic changes
3. Remove filler words (um, uh, like, you know) and false starts
4. Fix grammar and punctuation while preserving the original meaning
5. Add paragraph breaks for readability
6. Use markdown formatting (headers, lists, emphasis) appropriately
7. If there are clear topics or themes, create sections with descriptive headers
8. Extract and highlight key technical terms, concepts, or jargon relevant to ${detectedIndustry}

${includeTimestamps ? '9. Preserve any timestamp information in a readable format' : '9. Remove any timestamp information'}
${contextPrompt}

OUTPUT FORMAT:
- Use proper markdown syntax
- Start with a title if one can be inferred
- Use ## for main sections, ### for subsections
- Use bullet points for lists when appropriate
- Emphasize key points with **bold** or *italic*
- Use code blocks for technical terms when relevant
- Add horizontal rules (---) between major sections

Make the transcript professional and easy to read while maintaining the speaker's voice and meaning.`;

    const userPrompt = `Please format this ${detectedContentType} transcript into well-structured markdown:\n\n${transcriptionText}`;
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 4000
        });
        
        const formattedMarkdown = response.choices[0].message.content;
        
        console.log(`✅ Transcript formatted successfully!`);
        console.log(`→ Input length: ${transcriptionText.length} chars`);
        console.log(`→ Output length: ${formattedMarkdown.length} chars`);
        
        return {
            content: formattedMarkdown,
            contentType: detectedContentType,
            industry: detectedIndustry
        };
        
    } catch (error) {
        throw new Error(`OpenAI formatting error: ${error.message}`);
    }
}

// Sentiment Analysis
async function analyzeSentiment(transcriptionText, options = {}) {
    const { model = 'gpt-4o' } = options;
    
    console.log(`😊 Analyzing sentiment...`);
    
    const systemPrompt = `You are a sentiment analysis expert. Analyze the emotional tone and sentiment progression throughout this conversation.

INSTRUCTIONS:
1. Identify the overall sentiment (positive, negative, neutral)
2. Note any sentiment changes throughout the conversation
3. Identify emotional peaks or notable moments
4. Assess the tone of each speaker separately if multiple speakers
5. Provide confidence scores for your analysis

Return your analysis in clear, structured format.`;

    const userPrompt = `Please analyze the sentiment of this transcript:\n\n${transcriptionText}`;
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 800
        });
        
        console.log(`✅ Sentiment analysis completed!`);
        return response.choices[0].message.content;
        
    } catch (error) {
        throw new Error(`OpenAI sentiment analysis error: ${error.message}`);
    }
}

// Extract Action Items
async function extractActionItems(transcriptionText, options = {}) {
    const { model = 'gpt-4o' } = options;
    
    console.log(`📋 Extracting action items...`);
    
    const systemPrompt = `You are an action item extraction expert. Identify any tasks, commitments, follow-up items, or decisions mentioned in this conversation.

INSTRUCTIONS:
1. Extract specific actionable items with clear ownership when mentioned
2. Identify deadlines or timeframes if mentioned
3. Note any decisions that were made
4. Flag items that need follow-up or clarification
5. Categorize items by urgency/importance if apparent

Format as a markdown list with checkboxes for action items.`;

    const userPrompt = `Please extract action items from this transcript:\n\n${transcriptionText}`;
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 1000
        });
        
        console.log(`✅ Action items extracted!`);
        return response.choices[0].message.content;
        
    } catch (error) {
        throw new Error(`OpenAI action items error: ${error.message}`);
    }
}

// Extract Key Quotes
async function extractKeyQuotes(transcriptionText, options = {}) {
    const { model = 'gpt-4o', count = 5 } = options;
    
    console.log(`💬 Extracting key quotes...`);
    
    const systemPrompt = `You are a quote extraction expert. Identify the most impactful, quotable, or insightful statements from this conversation.

INSTRUCTIONS:
1. Extract ${count} most powerful or memorable quotes
2. Focus on statements that capture key insights or wisdom
3. Prefer complete thoughts over fragments
4. Include speaker attribution
5. Prioritize quotes that would be valuable for social sharing or highlighting

Format each quote with proper attribution and context.`;

    const userPrompt = `Please extract the top ${count} key quotes from this transcript:\n\n${transcriptionText}`;
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1200
        });
        
        console.log(`✅ Key quotes extracted!`);
        return response.choices[0].message.content;
        
    } catch (error) {
        throw new Error(`OpenAI quotes extraction error: ${error.message}`);
    }
}

// Generate Social Media Content
async function generateSocialContent(transcriptionText, options = {}) {
    const { model = 'gpt-4o' } = options;
    
    console.log(`📱 Generating social media content...`);
    
    const systemPrompt = `You are a social media content expert. Create engaging social media posts from this content for different platforms.

INSTRUCTIONS:
1. Create 1 Twitter/X post (280 characters max, include relevant hashtags)
2. Create 1 LinkedIn post (professional tone, 1-2 paragraphs)
3. Create 1 Instagram caption (engaging, visual-friendly with emojis)
4. Include relevant hashtags for each platform
5. Make content shareable and engaging while staying true to the original message

Format each platform section clearly with character counts.`;

    const userPrompt = `Please create social media content from this transcript:\n\n${transcriptionText}`;
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.4,
            max_tokens: 1500
        });
        
        console.log(`✅ Social media content generated!`);
        return response.choices[0].message.content;
        
    } catch (error) {
        throw new Error(`OpenAI social media error: ${error.message}`);
    }
}

// Extract Keywords and Tags
async function extractKeywords(transcriptionText, options = {}) {
    const { model = 'gpt-4o', count = 15 } = options;
    
    console.log(`🔍 Extracting keywords and tags...`);
    
    const systemPrompt = `You are an SEO and content tagging expert. Extract relevant keywords and hashtags for discoverability and SEO.

INSTRUCTIONS:
1. Identify ${count} most relevant keywords and phrases
2. Include both specific terms and broader topic categories
3. Generate relevant hashtags for social media
4. Consider search intent and content discoverability
5. Include both primary and secondary keywords

Format as: Keywords list, then Hashtags list.`;

    const userPrompt = `Please extract keywords and tags from this transcript:\n\n${transcriptionText}`;
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 800
        });
        
        console.log(`✅ Keywords and tags extracted!`);
        return response.choices[0].message.content;
        
    } catch (error) {
        throw new Error(`OpenAI keywords error: ${error.message}`);
    }
}

// Create Chapter Markers
async function createChapterMarkers(transcriptionText, options = {}) {
    const { model = 'gpt-4o', chapterCount = 6 } = options;
    
    console.log(`📚 Creating chapter markers...`);
    
    const systemPrompt = `You are a content structuring expert. Divide this content into logical chapters with timestamps and descriptions.

INSTRUCTIONS:
1. Create ${chapterCount} logical chapters based on topic changes
2. Estimate timestamps for each chapter (format: MM:SS)
3. Give each chapter a descriptive title
4. Provide a brief description of what's covered in each chapter
5. Ensure chapters flow logically and cover the full content

Format as numbered list with timestamps, titles, and descriptions.`;

    const userPrompt = `Please create chapter markers for this transcript:\n\n${transcriptionText}`;
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1200
        });
        
        console.log(`✅ Chapter markers created!`);
        return response.choices[0].message.content;
        
    } catch (error) {
        throw new Error(`OpenAI chapters error: ${error.message}`);
    }
}

// Generate Blog Post
async function generateBlogPost(transcriptionText, options = {}) {
    const { model = 'gpt-4o', videoTitle = 'Transcript Content' } = options;
    
    console.log(`📝 Generating blog post...`);
    
    const systemPrompt = `You are a professional blog writer. Convert this transcript into an engaging blog post with proper structure.

INSTRUCTIONS:
1. Create an engaging headline and introduction
2. Structure with clear headings and subheadings
3. Add transitions between sections for flow
4. Include a compelling conclusion with key takeaways
5. Make it SEO-friendly with natural keyword integration
6. Maintain the original insights while improving readability

Format as complete blog post with markdown formatting.`;

    const userPrompt = `Please convert this transcript into a blog post titled "${videoTitle}":\n\n${transcriptionText}`;
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.4,
            max_tokens: 3000
        });
        
        console.log(`✅ Blog post generated!`);
        return response.choices[0].message.content;
        
    } catch (error) {
        throw new Error(`OpenAI blog post error: ${error.message}`);
    }
}

// Generate Newsletter Format
async function generateNewsletter(transcriptionText, options = {}) {
    const { model = 'gpt-4o' } = options;
    
    console.log(`📧 Generating newsletter format...`);
    
    const systemPrompt = `You are a newsletter content specialist. Format this content for email newsletter distribution.

INSTRUCTIONS:
1. Create a catchy newsletter-style headline
2. Write a brief, engaging intro paragraph
3. Structure key points as scannable sections
4. Include "Key Takeaways" section with bullet points
5. Add a forward-friendly conclusion
6. Keep tone conversational but informative

Format for email newsletter with clear sections and engaging copy.`;

    const userPrompt = `Please format this transcript for newsletter distribution:\n\n${transcriptionText}`;
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.4,
            max_tokens: 2000
        });
        
        console.log(`✅ Newsletter format generated!`);
        return response.choices[0].message.content;
        
    } catch (error) {
        throw new Error(`OpenAI newsletter error: ${error.message}`);
    }
}

// Generate FAQ
async function generateFAQ(transcriptionText, options = {}) {
    const { model = 'gpt-4o' } = options;
    
    console.log(`❓ Generating FAQ...`);
    
    const systemPrompt = `You are an FAQ specialist. Extract common questions that could arise from this content and provide clear answers.

INSTRUCTIONS:
1. Identify 5-8 likely questions readers/viewers might have
2. Base questions on the content discussed
3. Provide clear, concise answers
4. Include both explicit and implicit information from the transcript
5. Make questions natural and commonly asked

Format as standard FAQ with Q: and A: format.`;

    const userPrompt = `Please create an FAQ based on this transcript:\n\n${transcriptionText}`;
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1500
        });
        
        console.log(`✅ FAQ generated!`);
        return response.choices[0].message.content;
        
    } catch (error) {
        throw new Error(`OpenAI FAQ error: ${error.message}`);
    }
}

// Generate Discussion Questions
async function generateDiscussionQuestions(transcriptionText, options = {}) {
    const { model = 'gpt-4o', count = 5 } = options;
    
    console.log(`🤔 Generating discussion questions...`);
    
    const systemPrompt = `You are an educational discussion facilitator. Create thought-provoking discussion questions based on this content.

INSTRUCTIONS:
1. Generate ${count} open-ended discussion questions
2. Focus on critical thinking and analysis
3. Include questions that encourage different perspectives
4. Make questions applicable beyond just this content
5. Vary question types (analytical, hypothetical, comparative)

Format as numbered list with clear, engaging questions.`;

    const userPrompt = `Please create discussion questions based on this transcript:\n\n${transcriptionText}`;
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.4,
            max_tokens: 1000
        });
        
        console.log(`✅ Discussion questions generated!`);
        return response.choices[0].message.content;
        
    } catch (error) {
        throw new Error(`OpenAI discussion questions error: ${error.message}`);
    }
}

// Generate Study Guide
async function generateStudyGuide(transcriptionText, options = {}) {
    const { model = 'gpt-4o' } = options;
    
    console.log(`📖 Generating study guide...`);
    
    const systemPrompt = `You are an educational content specialist. Create a comprehensive study guide from this content.

INSTRUCTIONS:
1. Extract key terms and definitions
2. Identify main concepts and themes
3. Create review questions with varying difficulty
4. Include practical applications or examples
5. Structure for effective learning and retention

Format with clear sections: Key Terms, Main Concepts, Review Questions, Applications.`;

    const userPrompt = `Please create a study guide from this transcript:\n\n${transcriptionText}`;
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });
        
        console.log(`✅ Study guide generated!`);
        return response.choices[0].message.content;
        
    } catch (error) {
        throw new Error(`OpenAI study guide error: ${error.message}`);
    }
}

async function createSummary(transcriptionText, options = {}) {
    const {
        model = 'gpt-4o',
        summaryLength = 'medium' // short, medium, long
    } = options;
    
    console.log(`📋 Creating summary...`);
    console.log(`→ Model: ${model}`);
    console.log(`→ Length: ${summaryLength}`);
    
    const lengthInstructions = {
        short: 'Create a concise summary in 2-3 sentences.',
        medium: 'Create a comprehensive summary in 1-2 paragraphs.',
        long: 'Create a detailed summary with key points and themes in 3-4 paragraphs.'
    };
    
    const systemPrompt = `You are a content summarization expert. Your task is to create a clear, informative summary of the transcript content.

INSTRUCTIONS:
${lengthInstructions[summaryLength]}

Focus on:
- Main topics and themes discussed
- Key insights or conclusions
- Important facts or data mentioned
- Any actionable items or recommendations

Write in a professional, clear style that captures the essence of the content.`;

    const userPrompt = `Please summarize this transcript:\n\n${transcriptionText}`;
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1000
        });
        
        const summary = response.choices[0].message.content;
        
        console.log(`✅ Summary created successfully!`);
        
        return summary;
        
    } catch (error) {
        throw new Error(`OpenAI summary error: ${error.message}`);
    }
}

// Comprehensive Analysis Function
async function performComprehensiveAnalysis(transcriptionText, options = {}) {
    const {
        model = 'gpt-4o',
        enableSentiment = true,
        enableActionItems = true,
        enableQuotes = true,
        enableSocial = true,
        enableKeywords = true,
        enableChapters = true,
        enableBlogPost = true,
        enableNewsletter = true,
        enableFAQ = true,
        enableDiscussion = true,
        enableStudyGuide = true,
        videoTitle = 'Transcript Content'
    } = options;
    
    console.log(`🚀 Starting comprehensive analysis...`);
    const results = {};
    
    try {
        // Run analyses in parallel for better performance
        const analyses = [];
        
        if (enableSentiment) {
            analyses.push(
                analyzeSentiment(transcriptionText, { model }).then(result => ({ sentiment: result }))
            );
        }
        
        if (enableActionItems) {
            analyses.push(
                extractActionItems(transcriptionText, { model }).then(result => ({ actionItems: result }))
            );
        }
        
        if (enableQuotes) {
            analyses.push(
                extractKeyQuotes(transcriptionText, { model }).then(result => ({ quotes: result }))
            );
        }
        
        if (enableSocial) {
            analyses.push(
                generateSocialContent(transcriptionText, { model }).then(result => ({ social: result }))
            );
        }
        
        if (enableKeywords) {
            analyses.push(
                extractKeywords(transcriptionText, { model }).then(result => ({ keywords: result }))
            );
        }
        
        if (enableChapters) {
            analyses.push(
                createChapterMarkers(transcriptionText, { model }).then(result => ({ chapters: result }))
            );
        }
        
        if (enableBlogPost) {
            analyses.push(
                generateBlogPost(transcriptionText, { model, videoTitle }).then(result => ({ blogPost: result }))
            );
        }
        
        if (enableNewsletter) {
            analyses.push(
                generateNewsletter(transcriptionText, { model }).then(result => ({ newsletter: result }))
            );
        }
        
        if (enableFAQ) {
            analyses.push(
                generateFAQ(transcriptionText, { model }).then(result => ({ faq: result }))
            );
        }
        
        if (enableDiscussion) {
            analyses.push(
                generateDiscussionQuestions(transcriptionText, { model }).then(result => ({ discussion: result }))
            );
        }
        
        if (enableStudyGuide) {
            analyses.push(
                generateStudyGuide(transcriptionText, { model }).then(result => ({ studyGuide: result }))
            );
        }
        
        // Wait for all analyses to complete
        const analysisResults = await Promise.all(analyses);
        
        // Merge results
        analysisResults.forEach(result => {
            Object.assign(results, result);
        });
        
        console.log(`✅ Comprehensive analysis completed!`);
        console.log(`→ Generated ${Object.keys(results).length} analysis types`);
        
        return results;
        
    } catch (error) {
        throw new Error(`Comprehensive analysis error: ${error.message}`);
    }
}

async function saveFormattedResults(formattedMarkdown, summary, videoId, videoTitle = null, outputDir = null, analysisResults = null) {
    // Use provided outputDir or get from folder utils
    let formattedDir;
    if (outputDir) {
        formattedDir = outputDir;
    } else {
        const { getOutputPaths } = require('./folder-utils');
        const paths = getOutputPaths(videoId);
        formattedDir = paths.formatted;
    }
    
    await fs.mkdir(formattedDir, { recursive: true });
    
    const title = videoTitle || `YouTube Video ${videoId}`;
    const savedFiles = {};
    
    // Create main markdown file with everything
    let fullMarkdown = `# ${title}

## Summary

${summary}

## Full Transcript

${formattedMarkdown.content || formattedMarkdown}`;
    
    // Add analysis results if available
    if (analysisResults) {
        if (analysisResults.sentiment) {
            fullMarkdown += `\n\n## Sentiment Analysis\n\n${analysisResults.sentiment}`;
        }
        
        if (analysisResults.actionItems) {
            fullMarkdown += `\n\n## Action Items\n\n${analysisResults.actionItems}`;
        }
        
        if (analysisResults.quotes) {
            fullMarkdown += `\n\n## Key Quotes\n\n${analysisResults.quotes}`;
        }
        
        if (analysisResults.keywords) {
            fullMarkdown += `\n\n## Keywords & Tags\n\n${analysisResults.keywords}`;
        }
        
        if (analysisResults.chapters) {
            fullMarkdown += `\n\n## Chapter Markers\n\n${analysisResults.chapters}`;
        }
        
        if (analysisResults.discussion) {
            fullMarkdown += `\n\n## Discussion Questions\n\n${analysisResults.discussion}`;
        }
    }
    
    const markdownFile = path.join(formattedDir, `${videoId}_formatted.md`);
    await fs.writeFile(markdownFile, fullMarkdown);
    console.log(`💾 Formatted markdown saved: ${markdownFile}`);
    savedFiles.markdownFile = markdownFile;
    
    // Save just the summary
    const summaryFile = path.join(formattedDir, `${videoId}_summary.md`);
    await fs.writeFile(summaryFile, `# ${title} - Summary\n\n${summary}`);
    console.log(`💾 Summary saved: ${summaryFile}`);
    savedFiles.summaryFile = summaryFile;
    
    // Save individual analysis files if available
    if (analysisResults) {
        if (analysisResults.sentiment) {
            const sentimentFile = path.join(formattedDir, `${videoId}_sentiment_analysis.md`);
            await fs.writeFile(sentimentFile, `# ${title} - Sentiment Analysis\n\n${analysisResults.sentiment}`);
            console.log(`💾 Sentiment analysis saved: ${sentimentFile}`);
            savedFiles.sentimentFile = sentimentFile;
        }
        
        if (analysisResults.actionItems) {
            const actionFile = path.join(formattedDir, `${videoId}_action_items.md`);
            await fs.writeFile(actionFile, `# ${title} - Action Items\n\n${analysisResults.actionItems}`);
            console.log(`💾 Action items saved: ${actionFile}`);
            savedFiles.actionFile = actionFile;
        }
        
        if (analysisResults.quotes) {
            const quotesFile = path.join(formattedDir, `${videoId}_key_quotes.md`);
            await fs.writeFile(quotesFile, `# ${title} - Key Quotes\n\n${analysisResults.quotes}`);
            console.log(`💾 Key quotes saved: ${quotesFile}`);
            savedFiles.quotesFile = quotesFile;
        }
        
        if (analysisResults.social) {
            const socialFile = path.join(formattedDir, `${videoId}_social_media.md`);
            await fs.writeFile(socialFile, `# ${title} - Social Media Content\n\n${analysisResults.social}`);
            console.log(`💾 Social media content saved: ${socialFile}`);
            savedFiles.socialFile = socialFile;
        }
        
        if (analysisResults.keywords) {
            const keywordsFile = path.join(formattedDir, `${videoId}_keywords.md`);
            await fs.writeFile(keywordsFile, `# ${title} - Keywords & Tags\n\n${analysisResults.keywords}`);
            console.log(`💾 Keywords saved: ${keywordsFile}`);
            savedFiles.keywordsFile = keywordsFile;
        }
        
        if (analysisResults.chapters) {
            const chaptersFile = path.join(formattedDir, `${videoId}_chapters.md`);
            await fs.writeFile(chaptersFile, `# ${title} - Chapter Markers\n\n${analysisResults.chapters}`);
            console.log(`💾 Chapters saved: ${chaptersFile}`);
            savedFiles.chaptersFile = chaptersFile;
        }
        
        if (analysisResults.blogPost) {
            const blogFile = path.join(formattedDir, `${videoId}_blog_post.md`);
            await fs.writeFile(blogFile, analysisResults.blogPost);
            console.log(`💾 Blog post saved: ${blogFile}`);
            savedFiles.blogFile = blogFile;
        }
        
        if (analysisResults.newsletter) {
            const newsletterFile = path.join(formattedDir, `${videoId}_newsletter.md`);
            await fs.writeFile(newsletterFile, `# ${title} - Newsletter Format\n\n${analysisResults.newsletter}`);
            console.log(`💾 Newsletter saved: ${newsletterFile}`);
            savedFiles.newsletterFile = newsletterFile;
        }
        
        if (analysisResults.faq) {
            const faqFile = path.join(formattedDir, `${videoId}_faq.md`);
            await fs.writeFile(faqFile, `# ${title} - FAQ\n\n${analysisResults.faq}`);
            console.log(`💾 FAQ saved: ${faqFile}`);
            savedFiles.faqFile = faqFile;
        }
        
        if (analysisResults.discussion) {
            const discussionFile = path.join(formattedDir, `${videoId}_discussion_questions.md`);
            await fs.writeFile(discussionFile, `# ${title} - Discussion Questions\n\n${analysisResults.discussion}`);
            console.log(`💾 Discussion questions saved: ${discussionFile}`);
            savedFiles.discussionFile = discussionFile;
        }
        
        if (analysisResults.studyGuide) {
            const studyFile = path.join(formattedDir, `${videoId}_study_guide.md`);
            await fs.writeFile(studyFile, `# ${title} - Study Guide\n\n${analysisResults.studyGuide}`);
            console.log(`💾 Study guide saved: ${studyFile}`);
            savedFiles.studyFile = studyFile;
        }
    }
    
    return savedFiles;
}

module.exports = {
    formatTranscriptToMarkdown,
    createSummary,
    saveFormattedResults,
    performComprehensiveAnalysis,
    analyzeSentiment,
    extractActionItems,
    extractKeyQuotes,
    generateSocialContent,
    extractKeywords,
    createChapterMarkers,
    generateBlogPost,
    generateNewsletter,
    generateFAQ,
    generateDiscussionQuestions,
    generateStudyGuide,
    detectContentType,
    detectIndustry
};