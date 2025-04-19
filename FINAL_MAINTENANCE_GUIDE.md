# Mafia: Chicago Platform - Final Maintenance Guide

This comprehensive guide provides detailed instructions for maintaining and troubleshooting all components of the Mafia: Chicago platform in production.

## System Architecture

The Mafia: Chicago platform consists of three main components:

1. **Frontend**: React application deployed on Surge.sh
2. **Backend**: NestJS application deployed on Render.com
3. **Telegram Bot**: Node.js application integrated with Telegram API

These components communicate through:
- RESTful API calls from frontend to backend
- WebSocket connections for real-time game updates
- Telegram Bot API for user interactions

## Regular Maintenance Tasks

### Weekly Maintenance

1. **Check System Health**
   ```bash
   ./verify_all_components.sh
   ```

2. **Monitor Error Logs**
   - Check Render.com logs for backend errors
   - Review frontend console errors via browser tools
   - Inspect Telegram bot logs

3. **Database Backup**
   - Export PostgreSQL database from Render.com
   ```bash
   pg_dump -U mafia_chicago_user -h postgres.render.com -d mafia_chicago > backup_$(date +%Y%m%d).sql
   ```

### Monthly Maintenance

1. **Update Dependencies**
   - Review and update npm packages for security patches
   ```bash
   # For each component
   npm outdated
   npm update
   ```

2. **Performance Review**
   - Check API response times
   - Monitor WebSocket connection stability
   - Review database query performance

3. **Security Audit**
   - Verify JWT token implementation
   - Check Telegram authentication security
   - Review CORS configuration

## WebSocket Optimization

The WebSocket connections are critical for real-time game functionality. Here are optimization techniques implemented:

1. **Connection Pooling**
   - The backend uses connection pooling to manage multiple concurrent WebSocket connections efficiently
   - Connection limits are set to prevent DoS attacks

2. **Heartbeat Mechanism**
   - Implemented ping/pong heartbeat to detect stale connections
   - Automatically reconnects when connection is lost

3. **Message Batching**
   - Groups small updates into batched messages to reduce overhead
   - Prioritizes critical game state updates

4. **Authentication Security**
   - Uses HMAC-SHA256 signatures for message authentication
   - Validates Telegram initData for secure connections

## Troubleshooting Guide

### Frontend Issues

1. **Blank Screen / Loading Issues**
   - Check browser console for JavaScript errors
   - Verify API endpoints are accessible
   - Confirm CORS headers are properly configured

2. **WebSocket Connection Failures**
   - Check network tab for WebSocket connection errors
   - Verify WebSocket URL is correct in environment variables
   - Ensure authentication headers are properly formatted

3. **Telegram WebApp Integration Issues**
   - Verify Telegram WebApp is properly initialized
   - Check initData validation
   - Ensure bot settings allow WebApp access

### Backend Issues

1. **API Endpoint Failures**
   - Check Render.com logs for errors
   - Verify database connection is active
   - Ensure environment variables are correctly set

2. **WebSocket Gateway Problems**
   - Check WebSocket namespace configuration
   - Verify CORS settings allow WebSocket connections
   - Monitor connection events in logs

3. **Database Connection Issues**
   - Check database credentials
   - Verify database service is running
   - Check for connection pool exhaustion

### Telegram Bot Issues

1. **Bot Not Responding**
   - Verify bot token is valid
   - Check webhook configuration
   - Ensure bot process is running

2. **WebApp Button Not Appearing**
   - Check bot commands configuration
   - Verify WebApp URL is correctly set
   - Ensure bot has proper permissions

3. **Authentication Failures**
   - Check initData validation logic
   - Verify secret keys match between bot and backend
   - Monitor authentication attempts in logs

## Scaling Considerations

As user base grows, consider these scaling strategies:

1. **Horizontal Scaling**
   - Add multiple backend instances behind a load balancer
   - Implement Redis for session sharing between instances
   - Use sticky sessions for WebSocket connections

2. **Database Optimization**
   - Add database indexes for frequently queried fields
   - Consider read replicas for heavy read operations
   - Implement query caching

3. **WebSocket Clustering**
   - Implement Redis adapter for WebSocket clustering
   - Use sticky sessions to maintain connection stability
   - Consider dedicated WebSocket servers for high traffic

## Monitoring Setup

1. **Health Checks**
   - The `/api/health` endpoint provides system health status
   - Configure uptime monitoring to check this endpoint regularly

2. **Performance Metrics**
   - Monitor API response times
   - Track WebSocket connection counts and message throughput
   - Monitor database query performance

3. **Error Tracking**
   - Implement centralized error logging
   - Set up alerts for critical errors
   - Monitor rate of authentication failures

## Backup and Recovery

1. **Database Backups**
   - Automated daily backups via Render.com
   - Manual backups before major updates
   - Store backups in secure, offsite location

2. **Configuration Backups**
   - Store environment variables securely
   - Back up Render.com and Surge.sh configuration
   - Document deployment procedures

3. **Recovery Procedures**
   - Database restoration process
   - Backend redeployment steps
   - Frontend republishing procedure

## Security Best Practices

1. **Authentication**
   - Use JWT with appropriate expiration
   - Implement Telegram initData validation
   - Secure WebSocket connections with signatures

2. **Data Protection**
   - Encrypt sensitive data in database
   - Use HTTPS for all connections
   - Implement proper input validation

3. **Access Control**
   - Restrict admin endpoints
   - Implement role-based access control
   - Audit access logs regularly

## Deployment Procedures

### Frontend Updates

1. Build the frontend:
   ```bash
   cd platform-webapp
   npm run build
   ```

2. Deploy to Surge.sh:
   ```bash
   npx surge dist https://mafia-chicago-game.surge.sh
   ```

### Backend Updates

1. Push changes to GitHub repository

2. Deploy via Render.com:
   - Automatic deployment triggered by GitHub push
   - Or manually deploy from Render dashboard

3. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Telegram Bot Updates

1. Build the bot:
   ```bash
   cd telegram-bot
   npm run build
   ```

2. Deploy to production server:
   ```bash
   npm run start:prod
   ```

3. Update webhook if needed:
   ```bash
   curl -X POST https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${BACKEND_URL}/bot${BOT_TOKEN}
   ```

## Contact Information

For urgent issues or questions, contact:
- Platform Administrator: admin@mafia-chicago.com
- Technical Support: support@mafia-chicago.com

## Changelog

- **v1.0.0** (April 2025): Initial production release
- **v1.0.1** (April 2025): WebSocket authentication improvements
- **v1.1.0** (April 2025): Performance optimizations and final deployment
