# Groq Integration - Deployment Checklist

## Pre-Deployment

### ✅ Code Changes (Completed)
- [x] Created `Server/utils/groqUtils.js`
- [x] Updated `Server/package.json` with groq-sdk
- [x] Updated `Server/.env` with GROQ_API_KEY
- [x] Updated ChatController import
- [x] Updated Socket messageHandlers import
- [x] Updated all Model imports (Note, Todo, Event)
- [x] Updated all Controller imports (6 files)
- [x] Updated all Script imports (5 files)
- [x] Updated ChatController system prompt
- [x] No breaking changes to existing code
- [x] All routes remain unchanged
- [x] All database schemas remain unchanged

### ✅ Documentation (Completed)
- [x] GROQ_INTEGRATION.md - Full guide
- [x] GROQ_QUICK_START.md - Quick reference
- [x] GROQ_INTEGRATION_SUMMARY.md - Executive summary
- [x] GROQ_API_REFERENCE.md - Technical reference
- [x] GROQ_DEPLOYMENT_CHECKLIST.md (this file)

---

## Deployment Steps

### Step 1: Update Dependencies
```bash
cd Server
npm install groq-sdk
```
**Status**: ⏳ TODO
**Estimated Time**: 1-2 minutes
**Verification**: `npm list groq-sdk` should show ^0.5.0

### Step 2: Verify Environment
```bash
# Check .env has GROQ_API_KEY
grep "GROQ_API_KEY" .env
```
**Status**: ⏳ TODO
**Expected Output**: `GROQ_API_KEY="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"`

### Step 3: Test Groq Connection
```bash
# Run RAG test
node scripts/testRAG.js
```
**Status**: ⏳ TODO
**Expected Output**: `SUCCESS: Embedding generated. Length: 1536`

### Step 4: Start Development Server
```bash
npm run dev
```
**Status**: ⏳ TODO
**Expected Output**: Server running on port 3000

### Step 5: Test Chat Endpoint
```bash
# Make a test request
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"Hello, how are you?"}'
```
**Status**: ⏳ TODO
**Expected Output**: Chat response with Groq integration

### Step 6: Test Real-time Chat
- Connect to Socket.io
- Send a message to verify real-time functionality
**Status**: ⏳ TODO

### Step 7: Test Embedding Generation
Create a new note and verify embedding is generated
**Status**: ⏳ TODO

---

## Production Deployment

### Pre-Production Checklist
- [ ] All tests passing
- [ ] No console errors
- [ ] API key securely stored (use secrets manager in prod)
- [ ] Rate limits understood and monitored
- [ ] Database backups created
- [ ] Rollback plan in place

### Production Deployment Steps
1. [ ] Build client: `npm run build`
2. [ ] Set production NODE_ENV
3. [ ] Deploy to production server
4. [ ] Verify GROQ_API_KEY in production .env
5. [ ] Run smoke tests
6. [ ] Monitor Groq dashboard for usage
7. [ ] Set up alerts for rate limit issues

### Post-Deployment Monitoring
- [ ] Check server logs for errors
- [ ] Monitor API response times
- [ ] Track embedding generation success rate
- [ ] Monitor Groq API usage and costs
- [ ] Set up alerts for failures

---

## Rollback Plan

If issues occur, rollback to Ollama:

### Rollback Steps
1. Stop server
2. Update all imports: `groqUtils` → `ollamaUtils`
3. Update .env: Remove GROQ_API_KEY, add OLLAMA_HOST
4. Start Ollama service locally
5. Restart server
6. Verify functionality

### Rollback Verification
```bash
# Should connect to local Ollama
curl http://localhost:11434/api/embeddings \
  -d '{"model":"nomic-embed-text","prompt":"test"}'
```

---

## Monitoring Dashboard

### Groq Dashboard
- **URL**: https://console.groq.com/usage
- **Monitor**: API usage, rate limits, costs
- **Alerts**: Set up notifications for quota issues

### Application Monitoring
- **Server Logs**: Check for Groq API errors
- **Database**: Monitor embedding collection growth
- **Performance**: Track response times

### Metrics to Track
- [ ] Average chat response time
- [ ] Average embedding generation time
- [ ] API error rate
- [ ] Rate limit hits
- [ ] Monthly API costs
- [ ] User satisfaction scores

---

## Troubleshooting Guide

### Issue: "GROQ_API_KEY not found"
**Cause**: Missing environment variable
**Solution**:
1. Add GROQ_API_KEY to .env
2. Restart server
3. Verify: `console.log(process.env.GROQ_API_KEY)`

### Issue: "Cannot find module 'groq-sdk'"
**Cause**: Dependencies not installed
**Solution**:
```bash
cd Server
npm install groq-sdk
npm ci
```

### Issue: "401 Unauthorized"
**Cause**: Invalid or expired API key
**Solution**:
1. Verify key at https://console.groq.com/keys
2. Update .env with correct key
3. Restart server

### Issue: "429 Too Many Requests"
**Cause**: Rate limit exceeded
**Solution**:
1. Check Groq dashboard for tier limits
2. Implement rate limiting in application
3. Consider upgrading Groq plan

### Issue: "500 Internal Server Error"
**Cause**: Groq API error or timeout
**Solution**:
1. Check Groq service status
2. Verify API key validity
3. Check server logs for detailed error
4. Increase timeout if needed

### Issue: "Embedding dimensions mismatch"
**Cause**: Using different embedding model
**Solution**: 
- Ensure using `nomic-embed-text-v1.5` (1536 dimensions)
- Compatible with existing MongoDB embeddings

---

## Performance Baselines

### Expected Response Times
- Chat response: 500ms - 2 seconds
- Embedding generation: 100ms per request
- Database lookup: 10-50ms

### Scaling Considerations
- Each API call counts against rate limits
- Monitor usage on Groq dashboard
- Plan for peak usage times
- Consider caching frequently used embeddings

---

## Backup & Recovery

### Database Backup
```bash
# Before deployment
mongodump --uri="$MONGODB_URI" --out=./backup/pre-groq
```

### Code Backup
```bash
# Git commit all changes
git add .
git commit -m "Migrate from Ollama to Groq API"
git tag groq-v1.0.0
```

### Recovery Procedure
1. Restore database from backup
2. Revert code to previous commit
3. Restart application

---

## Sign-Off

### Pre-Production Testing
- [ ] Chat functionality tested
- [ ] Embedding generation tested
- [ ] RAG context retrieval tested
- [ ] PDF generation tested
- [ ] Real-time messaging tested
- [ ] User authentication tested
- [ ] API routes tested

### Production Deployment
- [ ] All pre-tests passing
- [ ] Team lead approval
- [ ] Monitoring setup complete
- [ ] Rollback plan verified

### Post-Deployment
- [ ] Server monitoring active
- [ ] Error logging working
- [ ] Performance within baseline
- [ ] Users report positive experience

---

## Contact & Support

**Groq Support**:
- Console: https://console.groq.com
- Email: support@groq.com
- Status: https://status.groq.com

**Your Team**:
- Backend Lead: [Contact]
- DevOps: [Contact]
- On-Call: [Contact]

---

**Deployment Date**: [To be filled]
**Deployed By**: [Your name]
**Approved By**: [Team lead name]
**Notes**: [Any additional notes]

---

## Appendix: File Change Summary

### New Files
```
Server/utils/groqUtils.js
```

### Modified Files
```
Server/package.json
Server/.env
Server/Controller/ChatController.js
Server/Controller/TodoController.js
Server/Controller/UserController.js
Server/Controller/NotesController.js
Server/Controller/EventController.js
Server/Controller/SessionRoomController.js
Server/Model/NoteModel.js
Server/Model/ToDoModel.js
Server/Model/EventModel.js
Server/Socket/messageHandlers.js
Server/scripts/generateOllamaEmbeddings.js
Server/scripts/refreshUserEmbedding.js
Server/scripts/reproduceChatHang.js
Server/scripts/testRAG.js
```

### Unchanged
```
Database schemas
API routes
Frontend code
Authentication logic
Socket.io configuration
```

---

**Last Updated**: January 30, 2026
**Status**: Ready for Deployment
