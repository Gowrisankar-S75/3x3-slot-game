const express=require("express")
const cors=require("cors")
const path=require("path")

const engine=require("./spin")

const app=express()

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "../client")))

// In-memory sessions to track player balances securely
let sessions = {};

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

app.post("/init", (req, res) => {
    let { sessionId } = req.body;
    // Generate new session if none exists or it was lost
    if (!sessionId || !sessions[sessionId]) {
        sessionId = Date.now().toString() + Math.random().toString().slice(2);
        sessions[sessionId] = { balance: 1000 };
    }
    res.json({ sessionId, balance: sessions[sessionId].balance });
});

app.get("/spin",(req,res)=>{
    const grid = engine.spin()
    res.json(grid)
})

app.post("/spin",(req,res)=>{
    const bet=req.body.bet;
    const sessionId=req.body.sessionId;
    
    if (!sessionId || !sessions[sessionId]) {
        return res.status(400).json({ error: "Invalid session. Refresh the page." });
    }
    
    if (sessions[sessionId].balance < bet) {
        return res.status(400).json({ error: "Insufficient balance" });
    }
    
    // Deduct bet securely on the backend
    sessions[sessionId].balance -= bet;

    const grid = engine.spin();
    const result = engine.evaluate(grid, bet);
    
    // Add wins securely on the backend
    sessions[sessionId].balance += result.totalWin;

    res.json({
        grid,
        win: result.totalWin,
        winningLines: result.winningLines,
        balance: sessions[sessionId].balance
    });
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})