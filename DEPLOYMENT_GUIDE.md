# HomeU Deployment Guide

## Quick Start

### Local Development

1. **Start the development server:**
```bash
npm run dev
```
The server will start on `http://localhost:3000` (or next available port).

2. **Access the application:**
- Open your browser to `http://localhost:3000`
- Hot reload is enabled for rapid development

### Testing New Features Locally

1. **Make your changes** in the codebase
2. **The dev server auto-reloads** - just refresh your browser
3. **Build and test production mode:**
```bash
npm run build
npm start
```

---

## Vercel Deployment

### First-Time Setup

1. **Install Vercel CLI** (if not already installed):
```bash
npm i -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Link your project:**
```bash
vercel link
```

### Deploy to Preview (Testing)

Deploy your current branch to a preview URL:
```bash
vercel
```

This creates a unique URL for testing without affecting production.

### Deploy to Production

When ready to go live:
```bash
vercel --prod
```

### Automatic Deployments

If connected to GitHub:
- **Main branch** → Automatic production deployment
- **Other branches** → Automatic preview deployments

---

## Environment Variables

### Required Variables

Set these in the Vercel dashboard (Settings > Environment Variables):

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex Database
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
CONVEX_DEPLOYMENT=prod:...

# WorkOS
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...

# Straddle (if using payment features)
STRADDLE_API_KEY=...
NEXT_PUBLIC_STRADDLE_PUBLIC_KEY=...

# Add any other project-specific keys
```

### Setting Variables in Vercel

1. Go to your project in Vercel dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each variable for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (optional)

---

## Build Configuration

The project uses these configurations:

### `next.config.ts`
- ✅ Image optimization enabled
- ✅ Security headers configured
- ✅ TypeScript error checking (lenient for now)

### `vercel.json`
- ✅ Function timeout: 30 seconds
- ✅ CORS configured
- ✅ Admin route protection
- ✅ Region: iad1 (US East)

---

## Post-Deployment Checklist

After deploying to production:

- [ ] Test authentication flows (Clerk)
- [ ] Verify database connections (Convex)
- [ ] Test payment processing (if applicable)
- [ ] Check admin dashboard access
- [ ] Verify file uploads work
- [ ] Test email notifications
- [ ] Review error logs in Vercel dashboard
- [ ] Check performance metrics
- [ ] Verify all environment variables are set

---

## Common Issues & Solutions

### Build Fails

**Issue:** "Module not found" or build errors

**Solution:**
```bash
rm -rf node_modules .next package-lock.json
npm install
npm run build
```

### Environment Variables Not Working

**Issue:** Features not working in production

**Solution:**
1. Check Vercel dashboard > Environment Variables
2. Ensure variables are set for correct environment (Production/Preview)
3. Redeploy after adding variables: `vercel --prod`

### Port Already in Use (Local)

**Issue:** `Port 3000 is in use`

**Solution:**
- Next.js automatically uses the next available port (3001, 3002, etc.)
- Or manually kill the process: `lsof -ti:3000 | xargs kill`

---

## Monitoring & Logs

### View Deployment Logs

**In Vercel Dashboard:**
1. Go to your project
2. Click on **Deployments**
3. Select a deployment
4. View **Build Logs** and **Function Logs**

**Via CLI:**
```bash
vercel logs [deployment-url]
```

### Real-time Logs

```bash
vercel logs --follow
```

---

## Rolling Back

If something goes wrong in production:

1. Go to Vercel dashboard > **Deployments**
2. Find the last working deployment
3. Click **...** (three dots)
4. Select **Promote to Production**

Or via CLI:
```bash
vercel rollback
```

---

## Performance Optimization

### Before Deployment

1. **Run production build locally:**
```bash
npm run build
npm start
```

2. **Check bundle size:**
- Review `.next/analyze/client.html` (if analyzer enabled)
- Look for large dependencies

3. **Test performance:**
- Use Lighthouse in Chrome DevTools
- Check Core Web Vitals

### After Deployment

1. **Monitor in Vercel:**
- Check **Analytics** tab
- Review performance metrics
- Monitor error rates

---

## Security Notes

### Protecting Sensitive Routes

The project already has:
- ✅ Admin route protection in `vercel.json`
- ✅ Clerk authentication middleware
- ✅ Security headers in `next.config.ts`

### API Route Security

When adding new API routes:
1. Add authentication checks
2. Validate input data
3. Rate limit if needed
4. Add to CORS whitelist if required

---

## Quick Commands Reference

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Test production build
npm start                      # Run production build locally

# Deployment
vercel                         # Deploy to preview
vercel --prod                  # Deploy to production
vercel logs                    # View logs
vercel env ls                  # List environment variables
vercel rollback                # Rollback to previous deployment

# Maintenance
npm audit                      # Check for vulnerabilities
npm update                     # Update dependencies
npm run lint                   # Run linter
```

---

## Getting Help

### Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Convex Documentation](https://docs.convex.dev)

### Support
- Check `CODE_REVIEW_SUMMARY.md` for known issues
- Review error logs in Vercel dashboard
- Check Next.js GitHub issues for common problems

---

**Happy Deploying! 🚀**

*Last Updated: December 23, 2025*
