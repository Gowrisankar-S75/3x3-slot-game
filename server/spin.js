const reels = require("./reels")
const paylines = require("./paylines")
const paytable = require("./paytable")

function spin(){
    const grid=[]
    for(let r=0;r<reels.length;r++){
        const reel=reels[r]
        const stop=Math.floor(Math.random()*reel.length)
        grid.push([
            reel[stop],
            reel[(stop+1)%reel.length],
            reel[(stop+2)%reel.length]
        ])
    }
    return grid
}

function evaluate(grid,bet){
    let totalWin=0;
    let winningLines = [];

    for(const line of paylines){
        const s1=grid[0][line[0]]
        const s2=grid[1][line[1]]
        const s3=grid[2][line[2]]

        let symbol=s1
        if(symbol==="WILD") symbol=s2
        if(symbol==="WILD") symbol=s3

        if(
            (s1===symbol || s1==="WILD") &&
            (s2===symbol || s2==="WILD") &&
            (s3===symbol || s3==="WILD")
        ){
            totalWin += paytable[symbol]*bet;
            winningLines.push(line);
        }
    }
    return { totalWin, winningLines };
}

module.exports={spin,evaluate}