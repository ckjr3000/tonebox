// Module for creating and manipulating an oscillator
const ctx = new AudioContext();
const createOsc = document.getElementById('create-osc');
const oscChannel = document.getElementById('osc-channel');

createOsc.addEventListener('click', () => {
    createOsc.classList.add('hidden');
    oscChannel.classList.remove('hidden');
    let osc;
    let gain = ctx.createGain();
    let muted = false;

    const startBtn = document.getElementById('start-btn');

    const stopBtn = document.getElementById('stop-btn');
    stopBtn.setAttribute('disabled', 'disabled');

    const muteBtn = document.getElementById('mute-btn');
    muteBtn.setAttribute('disabled', 'disabled');

    const unMuteBtn = document.getElementById('unmute-btn');

    const gainCtrl = document.getElementById('gain-ctrl');
    const waveTypeSelect = document.getElementById('wave-type-select');
    const freqCtrl = document.getElementById('frequency-ctrl');

    startBtn.addEventListener('click', () => {
        startBtn.setAttribute('disabled', 'disabled');
        stopBtn.removeAttribute('disabled');
        muteBtn.removeAttribute('disabled');

        // create new oscillator every time start is clicked because an oscillator instance can only be started once
        osc = ctx.createOscillator(); 

        // set gain to current value on gain input element
        if(!muted){
            let gainVal = gainCtrl.value;
            gain.gain.setValueAtTime(gainVal, ctx.currentTime);
        }

        let waveShape = waveTypeSelect.value;
        osc.type = waveShape;

        let freqVal = freqCtrl.value;
        osc.frequency.setValueAtTime(freqVal, ctx.currentTime);

        // signal chain
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
    });

    stopBtn.addEventListener('click', (e) => {
        e.preventDefault();

        stopBtn.setAttribute('disabled', 'disabled');
        startBtn.removeAttribute('disabled');

        osc.stop();
    });

    muteBtn.addEventListener('click', (e) => {
        e.preventDefault();

        muted = true;

        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);

        muteBtn.classList.add('hidden');
        unMuteBtn.classList.remove('hidden');
    });

    unMuteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        muted = false;

        let gainVal = gainCtrl.value;
        gain.gain.setValueAtTime(gainVal, ctx.currentTime);

        muteBtn.classList.remove('hidden');
        unMuteBtn.classList.add('hidden');
    });

    gainCtrl.addEventListener('change', (e) => {
        let gainVal = e.target.value;
        if(!muted){
            gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.05);
        }
        if(gainVal == 0){
            muteBtn.setAttribute('disabled', 'disabled')
        } else {
            muteBtn.removeAttribute('disabled');
        }
    });

    waveTypeSelect.addEventListener('change', (e) => {
        let shape = e.target.value;
        osc.type = shape;
    });

    freqCtrl.addEventListener('change', (e) => {
        let freqVal = e.target.value;
        osc.frequency.linearRampToValueAtTime(freqVal, ctx.currentTime + 0.05);
    })
})

function getCurrentGainValue(){
    
}

// reset all form values on page load
window.onload = function(){
    oscChannel.reset();
}
