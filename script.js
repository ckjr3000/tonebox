// Module for creating and manipulating an oscillator
const ctx = new AudioContext();
const createOsc = document.getElementById('create-osc');
const oscChannel = document.getElementById('osc-channel');

createOsc.addEventListener('click', () => {
    createOsc.classList.add('hidden');
    oscChannel.classList.remove('hidden');
    let osc;
    let gain;
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

    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const tapBtn = document.getElementById('tap-btn');

    function createOscillator(){
         // create new oscillator every time start is clicked because an oscillator instance can only be started once
         osc = ctx.createOscillator(); 
         gain = ctx.createGain();

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
         osc.connect(gain);
         scDistortion.connect(cubicDistortion);
         cubicDistortion.connect(gain);
         gain.connect(ctx.destination);
 
    }

    startBtn.addEventListener('click', () => {
        startBtn.setAttribute('disabled', 'disabled');
        stopBtn.removeAttribute('disabled');
        muteBtn.removeAttribute('disabled');

        createOscillator();

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

        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);

        muteBtn.classList.add('hidden');
        unMuteBtn.classList.remove('hidden');
    });

    unMuteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        muted = false;
        let gainVal = gainCtrl.value;

        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.05);

        muteBtn.classList.remove('hidden');
        unMuteBtn.classList.add('hidden');
    });

    modeRadios.forEach((radio) => {
        radio.addEventListener('change', handleModeChange);
    })

    function handleModeChange(e){
        let mode = e.target.value;

        if (mode === "continuous") {
            tapBtn.classList.add('hidden');
            startBtn.removeAttribute('disabled');
            stopBtn.removeAttribute('disabled');
            muteBtn.removeAttribute('disabled');
            unMuteBtn.removeAttribute('disabled');
        } else if (mode === "tap") {
            if(osc){
                osc.stop();
            }
            tapBtn.classList.remove('hidden');
            startBtn.setAttribute('disabled', 'disabled');
            stopBtn.setAttribute('disabled', 'disabled');
            muteBtn.setAttribute('disabled', 'disabled');
            unMuteBtn.setAttribute('disabled', 'disabled');
        }
    }

    tapBtn.addEventListener('click', (e) => {
        e.preventDefault();
        createOscillator();
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    })

 
    /*
        GAIN CLICKING WORKAROUND 1
        1. Cancel all scheduled automation at current time (scheduled automation = any previous ramp) and hold the val the automation
           was at when cancelled
        2. normal ramp from current To new value
        3. 100 years ramp - this will be a flat ramp, going from x to x, therefore holding the gain value until it is explicitly set 
           again, in which case when go through the 3 steps again.
        ISSUE - Firefox does not support cancelAndHoldAtTime 
        ISSUE - Still get a click the first time gain is changed
    */
    // gainCtrl.addEventListener('input', (e) => {
    //     let gainVal = e.target.value;
    //     if(!muted){
    //         gain.gain.cancelAndHoldAtTime(ctx.currentTime);
    //         gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.05);
    //         gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + (60 * 60 * 24 * 365 * 100));
    //     }
        
    //     if(gainVal == 0){
    //         muteBtn.setAttribute('disabled', 'disabled')
    //     } else {
    //         muteBtn.removeAttribute('disabled');
    //     }
    // });

    /*
        GAIN CLICKING WORKAROUND 2
        Explicitly set value of gain to itself at current time - so linearRampToValue will treat this as the previous event
        and start the ramp from there

        ISSUE - Also doesn't work on firefox, not sure why
    */
    gainCtrl.addEventListener('input', (e) => {
        let gainVal = e.target.value;
        if(!muted){
            gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.05);
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
