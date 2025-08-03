#!/usr/bin/env node

const { downloadYouTubeAudio } = require("./src/transcription-tools/download-yt-video");
const { transcribeAudio, transcribeAudioWithGPT4o, saveWhisperTranscriptionResults, saveGPT4oTranscriptionResults } = require("./src/transcription-tools/transcribe-audio");
const { createStructuredTranscription, saveStructuredTranscriptionResults } = require("./src/transcription-tools/structured-transcription");
const { formatTranscriptToMarkdown, createSummary, saveFormattedResults, performComprehensiveAnalysis } = require("./src/transcription-tools/format-transcript");
const { ensureOutputFolders } = require("./src/transcription-tools/folder-utils");

// Load environment variables
require("dotenv").config({ path: __dirname + `/.env.cli` });

console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? 
  `✅ ${process.env.OPENAI_API_KEY.substring(0, 3)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 3)}` : 
  "❌ Not set");
console.log("OUTPUT_FOLDER:", process.env.OUTPUT_FOLDER || "❌ Not set");

// Store any arguments passed in using yargs
const yargs = require("yargs");
const argv = yargs(process.argv.slice(2)).argv;

console.log("Launching...");

if (argv.ytTranscript) {
  // Full YouTube transcription pipeline
  const youtubeUrl = argv.ytTranscript;
  if (!youtubeUrl || youtubeUrl === true) {
    console.error("Usage: --ytTranscript <YouTube-URL>");
    process.exit(1);
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY environment variable not set");
    process.exit(1);
  }
  
  console.log("🚀 Starting YouTube transcription pipeline...");
  
  (async () => {
    try {
      // Step 0: Ensure output folders exist
      console.log("\n📁 Step 0: Setting up output folders...");
      const folders = await ensureOutputFolders();
      console.log(`✅ Output structure ready at: ${folders.base}`);
      
      // Step 1: Download audio
      console.log("\n📥 Step 1: Downloading audio...");
      const downloadResult = await downloadYouTubeAudio(youtubeUrl);
      console.log(`✅ Audio downloaded: ${downloadResult.audioFile}`);
      
      // Step 2a: Transcribe with OpenAI Whisper
      console.log("\n🎤 Step 2a: Transcribing audio with Whisper...");
      const whisperTranscription = await transcribeAudio(downloadResult.audioFile);
      const whisperFiles = await saveWhisperTranscriptionResults(whisperTranscription, downloadResult.videoId);
      
      // Step 2b: Transcribe with GPT-4o
      console.log("\n🤖 Step 2b: Transcribing audio with GPT-4o...");
      const gpt4oOptions = {
        // Enhanced instructions for speaker identification and conversation formatting
      };
      const gpt4oTranscription = await transcribeAudioWithGPT4o(downloadResult.audioFile, gpt4oOptions);
      const gpt4oFiles = await saveGPT4oTranscriptionResults(gpt4oTranscription, downloadResult.videoId);
      
      // Step 2c: Create structured transcription with speaker diarization + timing
      console.log("\n🎯 Step 2c: Creating structured transcription...");
      const structuredTranscription = await createStructuredTranscription(downloadResult.audioFile);
      const structuredFiles = await saveStructuredTranscriptionResults(structuredTranscription, downloadResult.videoId);
      
      // Step 3: Enhanced formatting and analysis
      console.log("\n📝 Step 3: Enhanced formatting and analysis...");
      
      // Determine analysis level
      const analysisType = argv.analysis || 'basic';
      const contentType = argv.contentType || null;
      const industry = argv.industry || null;
      
      console.log(`→ Analysis type: ${analysisType}`);
      
      // Format transcript with enhanced features
      const formattedMarkdown = await formatTranscriptToMarkdown(whisperTranscription.text, {
        contentType,
        industry,
        includeTimestamps: false
      });
      
      const summary = await createSummary(whisperTranscription.text);
      
      let analysisResults = null;
      
      if (analysisType === 'full') {
        // Run comprehensive analysis
        analysisResults = await performComprehensiveAnalysis(whisperTranscription.text, {
          videoTitle: `YouTube Video ${downloadResult.videoId}`
        });
      } else if (analysisType === 'custom') {
        // Run selective analysis based on additional flags
        const analysisOptions = {
          enableSentiment: argv.sentiment !== false,
          enableActionItems: argv.actionItems !== false,
          enableQuotes: argv.quotes !== false,
          enableSocial: argv.social !== false,
          enableKeywords: argv.keywords !== false,
          enableChapters: argv.chapters !== false,
          enableBlogPost: argv.blogPost !== false,
          enableNewsletter: argv.newsletter !== false,
          enableFAQ: argv.faq !== false,
          enableDiscussion: argv.discussion !== false,
          enableStudyGuide: argv.studyGuide !== false,
          videoTitle: `YouTube Video ${downloadResult.videoId}`
        };
        
        analysisResults = await performComprehensiveAnalysis(whisperTranscription.text, analysisOptions);
      }
      
      const finalFiles = await saveFormattedResults(
        formattedMarkdown, 
        summary, 
        downloadResult.videoId, 
        null, 
        null, 
        analysisResults
      );
      
      console.log("\n🎉 Transcription pipeline completed!");
      console.log("📁 Files organized in:");
      console.log(`  📂 Downloads: ${folders.downloads}`);
      console.log(`  📂 Whisper Transcriptions: ${folders.whisperTranscriptions}`);
      console.log(`  📂 GPT-4o Transcriptions: ${folders.gpt4oTranscriptions}`);
      console.log(`  📂 Structured Transcriptions: ${folders.structuredTranscriptions}`);
      console.log(`  📂 Formatted: ${folders.formatted}`);
      console.log("\n📄 Files created:");
      console.log(`  🎵 Audio: ${downloadResult.audioFile}`);
      console.log("  🎤 Whisper files:");
      console.log(`    📊 Raw JSON: ${whisperFiles.jsonFile}`);
      console.log(`    ⏱️ Word timestamps: ${whisperFiles.srtFile}`);
      console.log(`    📝 Plain text: ${whisperFiles.txtFile}`);
      console.log("  🤖 GPT-4o files:");
      console.log(`    📊 Raw JSON: ${gpt4oFiles.jsonFile}`);
      console.log(`    📝 Plain text: ${gpt4oFiles.txtFile}`);
      console.log("  🎯 Structured files:");
      console.log(`    📊 Structured JSON: ${structuredFiles.jsonFile}`);
      console.log(`    🎭 Speaker SRT: ${structuredFiles.srtFile}`);
      console.log(`    💬 Conversation: ${structuredFiles.txtFile}`);
      console.log(`    📅 Timeline: ${structuredFiles.timelineFile}`);
      console.log("  📖 Formatted files:");
      console.log(`    📖 Formatted markdown: ${finalFiles.markdownFile}`);
      console.log(`    📋 Summary: ${finalFiles.summaryFile}`);
      
      // Show additional analysis files if they exist
      if (finalFiles.sentimentFile) {
        console.log(`    😊 Sentiment analysis: ${finalFiles.sentimentFile}`);
      }
      if (finalFiles.actionFile) {
        console.log(`    📋 Action items: ${finalFiles.actionFile}`);
      }
      if (finalFiles.quotesFile) {
        console.log(`    💬 Key quotes: ${finalFiles.quotesFile}`);
      }
      if (finalFiles.socialFile) {
        console.log(`    📱 Social media: ${finalFiles.socialFile}`);
      }
      if (finalFiles.keywordsFile) {
        console.log(`    🔍 Keywords & tags: ${finalFiles.keywordsFile}`);
      }
      if (finalFiles.chaptersFile) {
        console.log(`    📚 Chapter markers: ${finalFiles.chaptersFile}`);
      }
      if (finalFiles.blogFile) {
        console.log(`    📝 Blog post: ${finalFiles.blogFile}`);
      }
      if (finalFiles.newsletterFile) {
        console.log(`    📧 Newsletter: ${finalFiles.newsletterFile}`);
      }
      if (finalFiles.faqFile) {
        console.log(`    ❓ FAQ: ${finalFiles.faqFile}`);
      }
      if (finalFiles.discussionFile) {
        console.log(`    🤔 Discussion questions: ${finalFiles.discussionFile}`);
      }
      if (finalFiles.studyFile) {
        console.log(`    📖 Study guide: ${finalFiles.studyFile}`);
      }
      
    } catch (error) {
      console.error(`❌ Pipeline error: ${error.message}`);
      process.exit(1);
    }
  })();
  
} else {
  console.log("Sorry, you didn't enter a recognized command.");
  console.log("Available commands:");
  console.log("  --ytTranscript <YouTube-URL>      Full transcription pipeline using OpenAI Whisper");
  console.log("  --analysis <type>                 Analysis type: basic, full, custom");
  console.log("  --contentType <type>              Override content type detection");
  console.log("  --industry <industry>             Override industry detection");
}