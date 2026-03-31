# Groq API Integration - Technical Reference

## API Configuration

### Environment Variables
```env
GROQ_API_KEY="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"
```

---

## 1. Chat Completions

### Function Signature
```javascript
chatResponse(messages: Array<{role: string, content: string}>): Promise<string>
```

### Implementation Details
**Model**: `mixtral-8x7b-32768`
**Max Tokens**: 2048
**Temperature**: Default (0.7)
**Timeout**: 300 seconds

### Usage Example
```javascript
import { chatResponse } from "../utils/groqUtils.js";

const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "What is 2+2?" }
];

const response = await chatResponse(messages);
console.log(response); // "2+2 equals 4."
```

### API Endpoint Used
```
POST https://api.groq.com/openai/v1/chat/completions
Authorization: Bearer {GROQ_API_KEY}
Content-Type: application/json
```

### Request Format
```json
{
  "model": "mixtral-8x7b-32768",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "max_tokens": 2048
}
```

### Response Format
```json
{
  "choices": [
    {
      "message": {
        "content": "Response text here..."
      }
    }
  ]
}
```

---

## 2. Embeddings

### Function Signature
```javascript
generateEmbedding(text: string): Promise<number[] | null>
```

### Implementation Details
**Model**: `nomic-embed-text-v1.5`
**Embedding Dimension**: 1536
**Timeout**: 30 seconds
**Input Max Length**: Variable (auto-truncated by API)

### Usage Example
```javascript
import { generateEmbedding } from "../utils/groqUtils.js";

const text = "Studia is a collaborative study platform";
const embedding = await generateEmbedding(text);
console.log(embedding.length); // 1536
console.log(embedding[0]); // 0.123456...
```

### API Endpoint Used
```
POST https://api.groq.com/openai/v1/embeddings
Authorization: Bearer {GROQ_API_KEY}
Content-Type: application/json
```

### Request Format
```json
{
  "model": "nomic-embed-text-v1.5",
  "input": "Your text here..."
}
```

### Response Format
```json
{
  "data": [
    {
      "embedding": [0.123, 0.456, ..., 0.789],
      "index": 0
    }
  ]
}
```

---

## 3. Image Analysis

### Function Signature
```javascript
analyzeImage(imageBuffer: Buffer): Promise<string>
```

### Current Status
⚠️ **Not Supported** - Groq does not currently support image analysis

### Fallback Behavior
Returns: `"Image analysis is not currently supported. Please describe the image content in text instead."`

### Future Alternative
Consider using:
- Google Vision API
- Claude Vision (via Anthropic API)
- OpenAI Vision API

---

## Rate Limits & Quotas

### Free Tier (Default)
- Requests per minute: 30
- Tokens per minute: 6000
- Concurrent requests: 1

### Monitor Usage
- Dashboard: https://console.groq.com/usage
- Check real-time metrics and rate limit status

---

## Error Handling

### Common Errors

#### 1. Invalid API Key
```
Error: "401 Unauthorized"
Solution: Verify GROQ_API_KEY in .env
```

#### 2. Rate Limited
```
Error: "429 Too Many Requests"
Solution: Implement exponential backoff
```

#### 3. Timeout
```
Error: "request timed out"
Solution: Reduce input size or increase timeout
```

#### 4. Model Not Found
```
Error: "404 Model not found"
Solution: Check model name spelling
```

---

## Integration in Studia

### Where Embeddings Are Used

1. **Note Creation**
   - Triggered: On `NoteModel.save()`
   - Text: `${title} ${content}`

2. **Task Creation**
   - Triggered: On `ToDoModel.save()`
   - Text: `${title}`

3. **Event Creation**
   - Triggered: On `EventModel.save()`
   - Text: `${title}`

4. **User Profile Update**
   - Triggered: Via `UserController`
   - Text: `${name} ${bio} ${university} ${field}`

5. **Study Room Creation**
   - Triggered: Via `SessionRoomController`
   - Text: `${name} ${description}`

### Where Chat is Used

1. **REST Chat Endpoint**
   - Route: `POST /api/chat`
   - Controller: `ChatController.chat()`
   - Features: RAG context, history, PDF generation

2. **Real-time Chat**
   - Socket Event: `message`
   - Handler: `messageHandlers.js`
   - Features: Friend context, embeddings, typing indicators

3. **Background Processing**
   - Bulk embedding generation: `generateOllamaEmbeddings.js`
   - User re-embedding: `refreshUserEmbedding.js`

---

## Vector Search Integration

### Cosine Similarity
```javascript
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

### MongoDB Vector Storage
```javascript
embedding: {
    type: [Number],
    select: false  // Exclude from normal queries
}
```

### RAG Flow
1. User sends message
2. Generate embedding for query
3. Search MongoDB for similar documents (notes, tasks, etc)
4. Rank results by cosine similarity
5. Include top 5 results in system prompt
6. Send to Groq Chat API
7. Return response to user

---

## Performance Characteristics

### Chat Completions
- **Cold Start**: ~1000ms
- **Warm Request**: 500ms average
- **Max Time**: 300 seconds (timeout)
- **Output Speed**: Tokens generated per second

### Embeddings
- **Request Time**: ~100ms per request
- **Timeout**: 30 seconds
- **Caching**: Recommended for repeated texts

### Network
- Endpoint: `api.groq.com`
- Region: Global (CDN)
- SSL/TLS: Always encrypted

---

## SDK Installation & Usage

### Installation
```bash
npm install groq-sdk
```

### Basic Usage
```javascript
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const message = await groq.chat.completions.create({
    model: "mixtral-8x7b-32768",
    messages: [{ role: "user", content: "Hello!" }],
});

console.log(message.choices[0].message.content);
```

---

## Monitoring & Debugging

### Enable Debug Logging
```javascript
// Add to groqUtils.js for development
console.log("Groq Request:", { model, messages });
console.log("Groq Response:", response);
```

### Monitor in Production
- Check Groq Dashboard: https://console.groq.com
- Review rate limits and usage
- Set up alerts for quota issues

### Test Endpoints
```bash
# Test embeddings
curl -X POST "https://api.groq.com/openai/v1/embeddings" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"nomic-embed-text-v1.5","input":"test"}'

# Test chat
curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"mixtral-8x7b-32768","messages":[{"role":"user","content":"Hello"}]}'
```

---

## References

- **Groq API Docs**: https://console.groq.com/docs
- **Groq Models**: https://console.groq.com/keys
- **OpenAI Compatibility**: Chat API follows OpenAI format
- **Rate Limits**: https://console.groq.com/usage

---

**Last Updated**: January 30, 2026
**API Version**: Latest (as of integration date)
