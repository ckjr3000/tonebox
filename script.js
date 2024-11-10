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
    let scDistortion = ctx.createWaveShaper();
    let cubicDistortion = ctx.createWaveShaper();

    const startBtn = document.getElementById('start-btn');

    const stopBtn = document.getElementById('stop-btn');
    stopBtn.setAttribute('disabled', 'disabled');

    const muteBtn = document.getElementById('mute-btn');
    muteBtn.setAttribute('disabled', 'disabled');

    const unMuteBtn = document.getElementById('unmute-btn');

    const gainCtrl = document.getElementById('gain-ctrl');
    const waveTypeSelect = document.getElementById('wave-type-select');
    const freqSelect = document.getElementById('frequency-select');

    const scDistortionCtrl = document.getElementById('sc-distortion-ctrl');
    const cubicDistortionCtrl = document.getElementById('cubic-distortion-ctrl');

    startBtn.addEventListener('click', () => {
        startBtn.setAttribute('disabled', 'disabled');
        stopBtn.removeAttribute('disabled');
        muteBtn.removeAttribute('disabled');

        // create new oscillator every time start is clicked because an oscillator instance can only be started once
        osc = ctx.createOscillator(); 

        gain.gain.setValueAtTime(0, ctx.currentTime);
        // set gain to current value on gain input element
        if(!muted){
            let gainVal = gainCtrl.value;
            gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.5);
        }

        let waveShape = waveTypeSelect.value;
        osc.type = waveShape;

        let freqVal = freqSelect.value;
        osc.frequency.setValueAtTime(freqVal, ctx.currentTime);

        // signal chain
        osc.connect(scDistortion);
        scDistortion.connect(cubicDistortion);
        cubicDistortion.connect(gain);
        gain.connect(ctx.destination);

        // start
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

        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

        muteBtn.classList.add('hidden');
        unMuteBtn.classList.remove('hidden');
    });

    unMuteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        muted = false;

        let gainVal = gainCtrl.value;
        gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.05);

        muteBtn.classList.remove('hidden');
        unMuteBtn.classList.add('hidden');
    });

    gainCtrl.addEventListener('input', (e) => {
        let gainVal = e.target.value;
        if(!muted){
            gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.5);
        }
        
        if(gainVal == 0){
            muteBtn.setAttribute('disabled', 'disabled')
        } else {
            muteBtn.removeAttribute('disabled');
        }
    });

    waveTypeSelect.addEventListener('change', (e) => { // to do - figure out a way to cross fade to prevent clicks
        let shape = e.target.value;
        osc.type = shape;
    });

    freqSelect.addEventListener('change', (e) => {
        let freqVal = e.target.value;
        osc.frequency.linearRampToValueAtTime(freqVal, ctx.currentTime + 0.05);
    })


    scDistortionCtrl.addEventListener('input', (e) => {
        let level = e.target.value;
        scDistortion.curve = calculateSoftClippingCurve(level);
    })

    cubicDistortionCtrl.addEventListener('input', (e) => {
        let level = e.target.value;
        cubicDistortion.curve = calculateCubicDistortionCurve(level);
    })
})

function calculateSoftClippingCurve(level){
    const amount = parseFloat(level);
    let k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);

    for(let i = 0; i < n_samples; i++){
            let x = i * 2 / n_samples - 1;
            curve[i] = ( Math.PI + k ) * x * (1/6) / ( Math.PI + k * Math.abs(x));
        }
    return curve;
}

function calculateCubicDistortionCurve(level) {
    const amount = parseFloat(level);
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const factor = amount;

    for (let i = 0; i < n_samples; i++) {
        const x = (i * 2 / n_samples) - 1; 
        curve[i] = x - factor * Math.pow(x, 3); 
    } 

    return curve;
}

// reset all form values on page load
window.onload = function(){
    oscChannel.reset();
}
