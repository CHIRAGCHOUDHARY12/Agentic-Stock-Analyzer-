# ⚡ QUICK START GUIDE

## 🎯 Get Running in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```
Wait for packages to download (~30 seconds)

### Step 2: Start Server
```bash
npm start
```
You should see:
```
🚀 Agentic Stock Analyzer running on http://localhost:3000
📊 API endpoints available
💱 Exchange rate: 1 USD = ₹90.76
```

### Step 3: Open in Browser
```
http://localhost:3000
```

That's it! 🎉

## ✅ Verify Everything Works

Run tests in a new terminal:
```bash
npm test
```

Expected output:
```
✅ PASS: Server is running
✅ PASS: Stock API working
✅ PASS: Indian stock API working
✅ PASS: Comparison API working
✅ PASS: Analysis API working
✅ PASS: Frontend loads correctly

📊 Test Results: 6/6 tests passed
```

## 🎮 Try It Out

1. **Compare Stocks**: Click "Compare Stocks" button
   - Try: RELIANCE vs TCS
   - Or: AAPL vs MSFT

2. **Quick Analysis**: Click any stock in the sidebar
   - Click "Reliance" in Indian Stocks
   - Click "Apple" in US Stocks

3. **Currency Toggle**: Switch between INR and USD
   - Click 🇮🇳 INR or 🇺🇸 USD buttons

## 🐛 Common Issues

**Port already in use?**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Then try npm start again
```

**Dependencies not installing?**
```bash
# Try clearing npm cache
npm cache clean --force
npm install
```

**Server starts but browser shows nothing?**
- Check server terminal for errors
- Try clearing browser cache (Ctrl+Shift+R)
- Open browser console (F12) to see errors

## 📱 What to Expect

You should see:
- Modern dark theme interface
- Indian 🇮🇳 and US 🇺🇸 stock sections
- "Compare Stocks" and "New Analysis" buttons
- Live data indicator (green pulse)

## 🎯 Next Steps

- Try comparing different stocks
- Switch between INR and USD
- Check the analysis for insights
- Explore the chat interface

---

**Still stuck?** Check the full README.md or the error messages in your terminal!
