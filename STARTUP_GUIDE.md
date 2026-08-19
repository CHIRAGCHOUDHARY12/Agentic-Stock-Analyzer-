# 🚀 STARTUP INSTRUCTIONS - Stock Analyzer

## ⚡ Quick Start (3 Commands)

```bash
# 1. Install dependencies
npm install

# 2. Start server
npm start

# 3. Open browser
http://localhost:3000
```

---

## 🔥 IMPORTANT: Server Must Be Running!

**Before using the app, you MUST:**

1. Open terminal/command prompt
2. Navigate to project folder: `cd stock_analyzer_fixed`
3. Run: `npm start`
4. Wait for this message:
   ```
   🚀 Agentic Stock Analyzer running on http://localhost:3000
   📊 API endpoints available
   💱 Exchange rate: 1 USD = ₹90.76
   ```
5. Keep this terminal window open (don't close it!)
6. Now open browser: `http://localhost:3000`

---

## ❌ Common Errors & Fixes

### Error: "Network error: Unable to connect to server"

**Cause:** Server is not running

**Fix:**
```bash
# In terminal, run:
npm start

# Keep terminal open, then refresh browser
```

### Error: "Port 3000 is already in use"

**Fix (Windows):**
```bash
# Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Then start server again
npm start
```

**Fix (Mac/Linux):**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Then start server again
npm start
```

### Error: "Cannot find module 'express'"

**Fix:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
npm start
```

---

## 📊 How to Use the App

### 1. Compare Two Stocks

**Method 1: Button**
- Click "Compare Stocks" button
- Enter: `RELIANCE` and `TCS`
- Click "Compare Now"

**Method 2: Chat**
- Type: `Compare RELIANCE vs TCS`
- Press Enter

### 2. Analyze Single Stock

**Method 1: Sidebar**
- Click any stock in sidebar (Reliance, TCS, Apple, etc.)

**Method 2: Chat**
- Type: `Analyze RELIANCE`
- Press Enter

---

## ✅ Testing Real-Time Prices

The app now fetches **REAL prices from Yahoo Finance**!

Try these to see real prices:
- RELIANCE (Indian) → Should show ~₹1,461
- TCS (Indian) → Should show ~₹3,890
- AAPL (US) → Should show ~$188
- MSFT (US) → Should show ~$425

---

## 🌐 Supported Stocks

### Indian Stocks (NSE)
You can use either format:
- `RELIANCE` or `RELIANCE.NS`
- `TCS` or `TCS.NS`
- `INFY` or `INFY.NS`
- `HDFCBANK` or `HDFCBANK.NS`

### US Stocks
- `AAPL` - Apple
- `MSFT` - Microsoft
- `GOOGL` - Google
- `TSLA` - Tesla
- `NVDA` - NVIDIA

---

## 🔍 How It Works

1. **Real-time prices**: Fetched from Yahoo Finance API
2. **Fallback**: If API fails, uses realistic mock data
3. **Currency**: Auto-converts between INR ↔ USD
4. **Updates**: Exchange rates update every hour

---

## 🛠️ Development Mode

For auto-restart on file changes:

```bash
# Install nodemon (one-time)
npm install -g nodemon

# Run in dev mode
npm run dev
```

---

## 📱 Browser Requirements

Works best on:
- Chrome (recommended)
- Firefox
- Edge
- Safari

**Minimum screen width:** 768px

---

## 🐛 Still Having Issues?

### Check these:

1. **Is server running?**
   - Look for terminal with `npm start` running
   - Should show green text with port number

2. **Correct URL?**
   - Use: `http://localhost:3000`
   - NOT: `https://` or different port

3. **Network tab errors?**
   - Press F12 in browser
   - Check Console tab for errors
   - Check Network tab for failed requests

4. **Try clearing browser cache:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

---

## 📞 Getting Help

If still stuck:

1. Check server terminal for error messages
2. Check browser console (F12) for JavaScript errors
3. Try running tests: `npm test`
4. Verify all 6 tests pass

---

## 🎯 Expected Behavior

**When Working Correctly:**

✅ Server starts without errors
✅ Browser loads the dark theme UI
✅ Can click stocks in sidebar
✅ "Compare Stocks" button works
✅ Prices are realistic (e.g., Reliance ~₹1,461)
✅ Currency toggle works (INR ↔ USD)
✅ Loading spinner appears during fetch
✅ Analysis shows stock details

**When NOT Working:**

❌ Browser shows "Unable to connect"
❌ Prices are way off (e.g., ₹2450 instead of ₹1461)
❌ Buttons don't respond
❌ Loading spinner never stops

---

## 🔐 Security Note

- No API keys required
- Runs completely locally
- No data sent to external servers (except stock API)
- Safe to use on public WiFi

---

## ⚡ Performance Tips

- Server uses ~50-100MB RAM
- First load may be slower (fetching real prices)
- Subsequent loads are faster (cached)
- Close unused browser tabs for better performance

---

**Ready to start? Run `npm start` and enjoy! 🎉**
