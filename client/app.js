let sessionId = localStorage.getItem("slotSessionId");
let balance = 0;
let bet = 10;
let isAutoSpinning = false;
let isSpinning = false;
let audioCtx;
let spinNoiseOsc;

window.onload = async () => {
    // Initial UI Setup
    for(let r=0; r<3; r++) {
        drawRandomReel(r);
    }
    
    // Initialize Session with backend
    try {
        const res = await fetch("/init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId })
        });
        const data = await res.json();
        sessionId = data.sessionId;
        localStorage.setItem("slotSessionId", sessionId);
        updateBalance(data.balance);
        document.getElementById("result").innerText = "Place your bet and spin!";
    } catch (e) {
        showError("Failed to connect to server!");
    }
};

// AUDIO SYNTHESIS
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playClickSound() {
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function startSpinSound() {
    if(!audioCtx) return;
    spinNoiseOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    spinNoiseOsc.type = 'triangle';
    spinNoiseOsc.frequency.setValueAtTime(50, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    spinNoiseOsc.connect(gain);
    gain.connect(audioCtx.destination);
    spinNoiseOsc.start();
}

function stopSpinSound() {
    if(spinNoiseOsc) {
        try { spinNoiseOsc.stop(); } catch(e){}
        spinNoiseOsc = null;
    }
}

function playReelStopSound() {
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playWinSound(amount) {
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    
    // Arpeggio
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554.37, now + 0.1);
    osc.frequency.setValueAtTime(659.25, now + 0.2);
    osc.frequency.setValueAtTime(880, now + 0.3);
    if(amount > 50) {
        osc.frequency.setValueAtTime(1108.73, now + 0.4);
        osc.frequency.setValueAtTime(1318.51, now + 0.5);
    }
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + (amount > 50 ? 0.8 : 0.5));
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(now + 1);
}

// LOGIC

function drawRandomReel(reelIndex) {
    const reel = document.getElementById("reel"+reelIndex);
    reel.innerHTML = "";
    for(let row=0; row<3; row++) {
        const symbol = randomSymbol();
        const div = document.createElement("div");
        div.className = "symbol";
        div.innerHTML = `<img src="symbols/${symbol}.png" alt="${symbol}">`;
        reel.appendChild(div);
    }
}

function clearWinLines() {
    const svg = document.getElementById("win-lines-svg");
    svg.innerHTML = "";
    document.querySelectorAll(".symbol").forEach(s => s.classList.remove("symbol-win"));
}

async function spin(){
    initAudio();
    if (isSpinning) return;
    
    if(bet > balance){
        showError("Not enough balance!");
        document.getElementById("autoSpinToggle").checked = false;
        isAutoSpinning = false;
        return;
    }
    
    isSpinning = true;
    clearWinLines();
    playClickSound();
    startSpinSound();
    
    const spinBtn = document.getElementById("spinBtn");
    spinBtn.disabled = true;
    spinBtn.classList.add("spinning");
    
    updateBalance(balance - bet);
    
    document.getElementById("result").innerText = "Spinning...";
    document.getElementById("result").classList.remove("win-text");

    const turbo = document.getElementById("turboToggle").checked;
    startSpinAnimation(turbo);

    try {
        const res = await fetch("/spin",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({bet, sessionId})
        });

        const data = await res.json();
        if(data.error) {
            showError(data.error);
            stopSpinAnimation();
            resetSpinState();
            return;
        }
        
        stopReels(data.grid, data.win, data.winningLines, data.balance, turbo);
    } catch (e) {
        showError("Connection error!");
        stopSpinAnimation();
        resetSpinState();
    }
}

let spinIntervals = [];

function startSpinAnimation(turbo){
    const speed = turbo ? 40 : 80;
    for(let r=0;r<3;r++){
        const reel = document.getElementById("reel"+r);
        reel.classList.add("blur-spin");
        
        spinIntervals[r] = setInterval(() => {
            const symbols = reel.querySelectorAll('.symbol img');
            symbols.forEach(img => {
                img.src = `symbols/${randomSymbol()}.png`;
            });
        }, speed);
    }
}

function stopSpinAnimation() {
    stopSpinSound();
    for(let r=0;r<3;r++){
        clearInterval(spinIntervals[r]);
        document.getElementById("reel"+r).classList.remove("blur-spin");
    }
}

function stopReels(grid, win, winningLines, newBalance, turbo){
    const stopDelay = turbo ? 200 : 500;
    const staggerDelay = turbo ? 150 : 350;
    
    for(let r=0;r<3;r++){
        setTimeout(()=>{
            clearInterval(spinIntervals[r]);
            const reel = document.getElementById("reel"+r);
            reel.classList.remove("blur-spin");
            drawReel(r, grid);
            
            playReelStopSound();
            
            reel.classList.add("pop");
            setTimeout(() => reel.classList.remove("pop"), turbo ? 200 : 400);

            if(r===2){
                setTimeout(() => {
                    stopSpinSound();
                    finishSpin(win, winningLines, newBalance, turbo);
                }, 100);
            }
        }, stopDelay + (r * staggerDelay));
    }
}

function drawReel(reelIndex, grid){
    const reel = document.getElementById("reel"+reelIndex);
    reel.innerHTML = "";
    for(let row=0; row<3; row++){
        const symbol = grid[reelIndex][row];
        const div = document.createElement("div");
        div.className = "symbol";
        div.id = `symbol-${reelIndex}-${row}`;
        div.innerHTML = `<img src="symbols/${symbol}.png" alt="${symbol}">`;
        reel.appendChild(div);
    }
}

function randomSymbol(){
    const symbols = ["HV1","HV2","HV3","LV1","LV2","LV3","WILD"];
    return symbols[Math.floor(Math.random()*symbols.length)];
}

function drawWinningLines(winningLines) {
    if(!winningLines || winningLines.length === 0) return;
    const svg = document.getElementById("win-lines-svg");
    
    winningLines.forEach((line, index) => {
        let pathStr = "";
        for(let r=0; r<3; r++) {
            const row = line[r];
            const symEl = document.getElementById(`symbol-${r}-${row}`);
            if(symEl) {
                symEl.classList.add("symbol-win");
                
                const machine = document.getElementById("slot-machine");
                const mRect = machine.getBoundingClientRect();
                const sRect = symEl.getBoundingClientRect();
                
                const x = sRect.left - mRect.left + (sRect.width / 2);
                const y = sRect.top - mRect.top + (sRect.height / 2);
                
                if(r === 0) {
                    pathStr += `M ${x} ${y} `;
                } else {
                    pathStr += `L ${x} ${y} `;
                }
            }
        }
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathStr);
        path.setAttribute("class", "win-line-path line-" + (index % 3));
        svg.appendChild(path);
    });
}

function finishSpin(win, winningLines, newBalance, turbo){
    updateBalance(newBalance);
    
    const resultEl = document.getElementById("result");
    if(win > 0) {
        resultEl.innerText = `YOU WON $${win}!`;
        resultEl.classList.add("win-text");
        playWinSound(win);
        celebrate(win);
        drawWinningLines(winningLines);
    } else {
        resultEl.innerText = "Try again!";
    }
    
    resetSpinState();
    
    if (isAutoSpinning) {
        setTimeout(() => {
            if(isAutoSpinning) spin();
        }, turbo ? 500 : 1500);
    }
}

function resetSpinState() {
    isSpinning = false;
    const spinBtn = document.getElementById("spinBtn");
    if(!isAutoSpinning) {
        spinBtn.disabled = false;
    }
    spinBtn.classList.remove("spinning");
}

function updateBalance(amt) {
    balance = amt;
    document.getElementById("balance").innerText = "$" + amt.toLocaleString();
}

function celebrate(win){
    if(win > 0){
        document.body.classList.add("winFlash");
        setTimeout(()=>{
            document.body.classList.remove("winFlash");
        },1000);
    }
    if(win > 50){
        document.body.classList.add("bigWin");
        setTimeout(()=>{
            document.body.classList.remove("bigWin");
        },2000);
    }
}

function setBet(value, btnEl){
    if(isSpinning) return;
    initAudio();
    playClickSound();
    bet = value;
    document.querySelectorAll('.bet-btn').forEach(btn => btn.classList.remove('active'));
    if(btnEl) btnEl.classList.add('active');
}

function toggleAutoSpin() {
    initAudio();
    playClickSound();
    isAutoSpinning = document.getElementById("autoSpinToggle").checked;
    
    if (isAutoSpinning && !isSpinning) {
        spin();
    } else if (!isAutoSpinning && !isSpinning) {
        document.getElementById("spinBtn").disabled = false;
    } else if (isAutoSpinning) {
        document.getElementById("spinBtn").disabled = true;
    }
}

function showError(msg) {
    const resultEl = document.getElementById("result");
    resultEl.innerText = msg;
    resultEl.classList.add("error-text");
    setTimeout(() => {
        resultEl.classList.remove("error-text");
        resultEl.innerText = "Place your bet and spin!";
    }, 2500);
}