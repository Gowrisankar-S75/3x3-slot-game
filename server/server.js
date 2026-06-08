const express=require("express")
const cors=require("cors")
const path=require("path")

const engine=require("./spin")

const app=express()

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "../client")))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
})

app.get("/spin",(req,res)=>{
const grid = engine.spin()
res.json(grid)
})

app.post("/spin",(req,res)=>{

const bet=req.body.bet

const grid=engine.spin()

const win=engine.evaluate(grid,bet)

res.json({

grid,
win

})

})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})