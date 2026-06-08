const engine = require("../server/spin")

const BET = 1

const SPINS = 10000000

let totalBet = 0
let totalWin = 0

for(let i=0;i<SPINS;i++){

const grid = engine.spin()

const win = engine.evaluate(grid,BET)

totalBet += BET
totalWin += win

}

const RTP = (totalWin / totalBet) * 100

console.log("Spins:",SPINS)
console.log("Total Bet:",totalBet)
console.log("Total Win:",totalWin)

console.log("RTP:",RTP.toFixed(2)+"%")